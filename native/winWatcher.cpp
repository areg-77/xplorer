#include "watcher.h"
#include <windows.h>
#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <thread>
#include <mutex>
#include <deque>
#include <tuple>

struct Event {
  std::wstring type;
  std::wstring path;
  bool isDir;
  std::chrono::steady_clock::time_point timestamp;
};

std::mutex eventsMutex;
std::pair<std::wstring, bool> renameOld;

bool SafeIsDir(const std::wstring& path) {
  DWORD attrs = GetFileAttributesW(path.c_str());
  if (attrs == INVALID_FILE_ATTRIBUTES) {
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    attrs = GetFileAttributesW(path.c_str());
  }
  return (attrs != INVALID_FILE_ATTRIBUTES) && (attrs & FILE_ATTRIBUTE_DIRECTORY);
}

void FlushOldEvents(std::vector<Event>& recentEvents, std::function<void(const std::wstring&, const std::wstring&, bool)> emit) {
  while (true) {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    auto cutoff = std::chrono::steady_clock::now() - std::chrono::milliseconds(500);

    std::lock_guard<std::mutex> lock(eventsMutex);
    for (auto it = recentEvents.begin(); it != recentEvents.end();) {
      if (it->timestamp < cutoff) {
        emit(it->type, it->path, it->isDir);
        it = recentEvents.erase(it);
      }
      else
        ++it;
    }
  }
}

std::deque<std::tuple<std::wstring, bool, std::chrono::steady_clock::time_point>> pendingRenames;

void FlushPendingRenames() {
  while (true) {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    auto cutoff = std::chrono::steady_clock::now() - std::chrono::milliseconds(500);

    std::lock_guard<std::mutex> lock(eventsMutex);
    while (!pendingRenames.empty() && std::get<2>(pendingRenames.front()) < cutoff)
      pendingRenames.pop_front();
  }
}

void WatchDirectory(const std::wstring& directory, std::function<void(const std::wstring&, const std::wstring&, bool)> emit) {
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

  char buffer[64 * 1024];
  DWORD bytesReturned;
  std::vector<Event> recentEvents;

  std::thread flushOldThread(FlushOldEvents, std::ref(recentEvents), emit);
  flushOldThread.detach();

  std::thread flushRenameThread(FlushPendingRenames);
  flushRenameThread.detach();

  while (true) {
    if (ReadDirectoryChangesW(hDir, buffer, sizeof(buffer), TRUE, FILE_NOTIFY_CHANGE_FILE_NAME | FILE_NOTIFY_CHANGE_DIR_NAME, &bytesReturned, NULL, NULL)) {
      FILE_NOTIFY_INFORMATION* info = reinterpret_cast<FILE_NOTIFY_INFORMATION*>(buffer);
      do {
        std::wstring fileName(info->FileName, info->FileNameLength / sizeof(WCHAR));
        std::wstring fullPath = directory + L"\\" + fileName;
        auto now = std::chrono::steady_clock::now();
        bool isDir = SafeIsDir(fullPath);

        std::lock_guard<std::mutex> lock(eventsMutex);

        auto alreadyExists = [&](const std::wstring& path, const std::wstring& type) {
          for (auto& e : recentEvents) {
            auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now - e.timestamp).count();
            if (ms < 500 && e.path == path && e.type == type)
              return true;
          }
          return false;
        };

        switch (info->Action) {
          case FILE_ACTION_ADDED:
          {
            bool handled = false;
            for (auto it = recentEvents.begin(); it != recentEvents.end(); ++it) {
              auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now - it->timestamp).count();
              if (ms < 500 && it->type == L"delete") {
                emit(L"move", it->path + L"|" + fullPath, isDir);
                recentEvents.erase(it);
                handled = true;
                break;
              }
            }
            if (!handled && !alreadyExists(fullPath, L"add"))
              recentEvents.push_back({L"add", fullPath, isDir, now});
            break;
          }

          case FILE_ACTION_REMOVED:
            if (!alreadyExists(fullPath, L"delete"))
              recentEvents.push_back({L"delete", fullPath, isDir, now});
            break;

          case FILE_ACTION_RENAMED_OLD_NAME:
            pendingRenames.push_back({ fullPath, isDir, now });
            break;

          case FILE_ACTION_RENAMED_NEW_NAME:
          {
            bool matched = false;
            for (auto it = pendingRenames.begin(); it != pendingRenames.end(); ++it) {
              auto [oldPath, oldIsDir, timestamp] = *it;
              auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now - timestamp).count();
              if (ms < 500) {
                emit(L"rename", oldPath + L"|" + fullPath, oldIsDir);
                pendingRenames.erase(it);
                matched = true;
                break;
              }
            }
            if (!matched)
              emit(L"rename", L"?" + std::wstring(L"|") + fullPath, isDir);
            break;
          }
        }

        if (info->NextEntryOffset == 0) break;
        info = reinterpret_cast<FILE_NOTIFY_INFORMATION*>(reinterpret_cast<char*>(info) + info->NextEntryOffset);
      } while (true);
    }
  }

  CloseHandle(hDir);
}
