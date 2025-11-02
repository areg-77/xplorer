#include <napi.h>
#include <efsw/efsw.hpp>
#include <thread>
#include <mutex>
#include <unordered_map>
#include <chrono>
#include <filesystem>
#include <algorithm>

namespace fs = std::filesystem;

const int MOVE_WINDOW_MS = 300;
const int CLEANUP_INTERVAL_MS = 50;

class Watcher : public Napi::ObjectWrap<Watcher>, public efsw::FileWatchListener {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Watcher", {
      InstanceMethod("start", &Watcher::Start),
      InstanceMethod("stop", &Watcher::Stop),
      InstanceMethod("on", &Watcher::On)
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("Watcher", func);
    return exports;
  }

  Watcher(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<Watcher>(info), stop_(false) {}

  void Start(const Napi::CallbackInfo& info) {
    if (info.Length() < 1 || !info[0].IsString()) {
      Napi::TypeError::New(info.Env(), "Expected directory path").ThrowAsJavaScriptException();
      return;
    }

    std::string path = info[0].As<Napi::String>();

    tsfn_ = Napi::ThreadSafeFunction::New(
      info.Env(),
      Napi::Function::New(info.Env(), [](const Napi::CallbackInfo&){ /* dummy */ }),
      "WatcherTSFN",
      0,
      1
    );

    watcherThread_ = std::thread([this, path]() {
      fileWatcher_.addWatch(path, this, true);
      fileWatcher_.watch();
    });

    cleanupThread_ = std::thread([this]() {
      while (!stop_) {
        std::this_thread::sleep_for(std::chrono::milliseconds(CLEANUP_INTERVAL_MS));
        cleanupOldDeletes();
      }
    });
  }

  void Stop(const Napi::CallbackInfo&) {
    stop_ = true;

    if (watcherThread_.joinable()) watcherThread_.join();
    if (cleanupThread_.joinable()) cleanupThread_.join();

    if (tsfn_) {
      tsfn_.Release();
    }
  }

  void On(const Napi::CallbackInfo& info) {
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsFunction()) {
      Napi::TypeError::New(info.Env(), "Expected event name and callback").ThrowAsJavaScriptException();
      return;
    }

    std::string eventName = info[0].As<Napi::String>();
    Napi::Function cb = info[1].As<Napi::Function>();

    std::lock_guard<std::mutex> lock(callbackMutex_);
    callbacks_[eventName] = Napi::Persistent(cb);
  }

  void handleFileAction(efsw::WatchID, const std::string& dir, const std::string& filename,
                        efsw::Action action, std::string oldFilename = "") override {
    auto now = std::chrono::steady_clock::now();
    std::string fullPath = makePath(dir, filename);
    std::string oldPath = makePath(dir, oldFilename);

    if (action == efsw::Actions::Add) {
      std::lock_guard<std::mutex> lock(deleteMutex_);
      for (auto it = recentDeletes_.begin(); it != recentDeletes_.end(); ++it) {
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - it->second.time).count();
        if (elapsed <= MOVE_WINDOW_MS) {
          emitEvent("move", {it->second.path, fullPath});
          recentDeletes_.erase(it);
          return;
        }
      }
      emitEvent("add", {fullPath, getFileType(fullPath)});
    } else if (action == efsw::Actions::Delete) {
      std::lock_guard<std::mutex> lock(deleteMutex_);
      recentDeletes_[filename] = {fullPath, now};
    } else if (action == efsw::Actions::Moved) {
      emitEvent("rename", {oldPath, fullPath});
    }
  }

private:
  struct DeleteInfo {
    std::string path;
    std::chrono::steady_clock::time_point time;
  };

  std::unordered_map<std::string, DeleteInfo> recentDeletes_;
  std::unordered_map<std::string, Napi::FunctionReference> callbacks_;
  std::mutex deleteMutex_;
  std::mutex callbackMutex_;

  efsw::FileWatcher fileWatcher_;
  std::thread watcherThread_;
  std::thread cleanupThread_;
  bool stop_;

  Napi::ThreadSafeFunction tsfn_;

  void cleanupOldDeletes() {
    auto now = std::chrono::steady_clock::now();
    std::lock_guard<std::mutex> lock(deleteMutex_);
    for (auto it = recentDeletes_.begin(); it != recentDeletes_.end();) {
      auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - it->second.time).count();
      if (elapsed > MOVE_WINDOW_MS) {
        emitEvent("delete", {it->second.path});
        it = recentDeletes_.erase(it);
      } else ++it;
    }
  }

  void emitEvent(const std::string& eventName, const std::vector<std::string>& args) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    auto it = callbacks_.find(eventName);
    if (it == callbacks_.end() || !tsfn_) return;

    std::vector<std::string> argsCopy = args;
    Napi::FunctionReference* callbackRef = &it->second;

    tsfn_.BlockingCall([callbackRef, argsCopy](Napi::Env env, Napi::Function) {
      std::vector<napi_value> jsArgs;
      for (auto& s : argsCopy) {
        jsArgs.push_back(Napi::String::New(env, s));
      }
      callbackRef->Call(jsArgs);
    });
  }

  std::string makePath(const std::string& dir, const std::string& filename) {
    std::string path = (fs::path(dir) / filename).string();
    std::replace(path.begin(), path.end(), '\\', '/');
    return path;
  }

  std::string getFileType(const std::string& path) {
    try {
      if (fs::is_regular_file(path)) return "file";
      if (fs::is_directory(path)) return "folder";
    } catch (...) {}
    return "unknown";
  }
};

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  return Watcher::Init(env, exports);
}

NODE_API_MODULE(watcher, InitAll)
