#include "watcher.h"
#include <windows.h>
#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <thread>
#include <mutex>

struct Event {
  std::wstring type;
  std::wstring path;
  std::chrono::steady_clock::time_point timestamp;
};

std::mutex eventsMutex;
std::wstring renameOld;

void FlushOldEvents(std::vector<Event>& recentEvents, std::function<void(const std::wstring&, const std::wstring&)> emit) {
  while (true) {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    auto cutoff = std::chrono::steady_clock::now() - std::chrono::milliseconds(500);

    std::lock_guard<std::mutex> lock(eventsMutex);
    for (auto it = recentEvents.begin(); it != recentEvents.end();) {
      if (it->timestamp < cutoff) {
        emit(it->type, it->path);
        it = recentEvents.erase(it);
      }
      else
        ++it;
    }
  }
}

void WatchDirectory(const std::wstring& directory, std::function<void(const std::wstring&, const std::wstring&)> emit) {
  HANDLE hDir = CreateFileW(
    directory.c_str(),
    FILE_LIST_DIRECTORY,
    FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
    NULL,
    OPEN_EXISTING,
    FILE_FLAG_BACKUP_SEMANTICS,
    NULL
  );

  if (hDir == INVALID_HANDLE_VALUE) return;

  char buffer[1024];
  DWORD bytesReturned;
  std::vector<Event> recentEvents;

  std::thread flushThread(FlushOldEvents, std::ref(recentEvents), emit);
  flushThread.detach();

  while (true) {
    if (ReadDirectoryChangesW(
      hDir,
      buffer,
      sizeof(buffer),
      TRUE,
      FILE_NOTIFY_CHANGE_FILE_NAME | FILE_NOTIFY_CHANGE_DIR_NAME,
      &bytesReturned,
      NULL,
      NULL
    )) {
      FILE_NOTIFY_INFORMATION* info = reinterpret_cast<FILE_NOTIFY_INFORMATION*>(buffer);
      do {
        std::wstring fileName(info->FileName, info->FileNameLength / sizeof(WCHAR));
        std::wstring fullPath = directory + L"\\" + fileName;
        auto now = std::chrono::steady_clock::now();

        if (info->Action == FILE_ACTION_ADDED || info->Action == FILE_ACTION_REMOVED) {
          std::wstring eventType = (info->Action == FILE_ACTION_ADDED) ? L"add" : L"delete";
          bool handled = false;

          std::lock_guard<std::mutex> lock(eventsMutex);
          for (auto it = recentEvents.begin(); it != recentEvents.end(); ++it) {
            auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now - it->timestamp).count();
            if (ms < 500) {
              if (eventType == L"add" && it->type == L"delete") {
                emit(L"move", it->path + L"|" + fullPath);
                recentEvents.erase(it);
                handled = true;
                break;
              }
            }
          }

          if (!handled)
            recentEvents.push_back({eventType, fullPath, now});
        }
        else if (info->Action == FILE_ACTION_RENAMED_OLD_NAME) {
          std::lock_guard<std::mutex> lock(eventsMutex);
          renameOld = fullPath;
        }
        else if (info->Action == FILE_ACTION_RENAMED_NEW_NAME) {
          std::lock_guard<std::mutex> lock(eventsMutex);
          if (!renameOld.empty()) {
            emit(L"rename", renameOld + L"|" + fullPath);
            renameOld.clear();
          }
          else
            emit(L"rename", L"?" + std::wstring(L"|") + fullPath);
        }

        if (info->NextEntryOffset == 0) break;
        info = reinterpret_cast<FILE_NOTIFY_INFORMATION*>(
          reinterpret_cast<char*>(info) + info->NextEntryOffset
        );
      } while (true);
    }
  }

  CloseHandle(hDir);
}
