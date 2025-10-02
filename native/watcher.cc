#include <napi.h>
#include <thread>
#include "watcher.h"

Napi::ThreadSafeFunction tsfn;

void EmitEvent(const std::wstring& type, const std::wstring& path) {
  if (tsfn) {
    tsfn.BlockingCall([type, path](Napi::Env env, Napi::Function jsCallback) {
      jsCallback.Call({ 
        Napi::String::New(env, std::string(type.begin(), type.end())),
        Napi::String::New(env, std::string(path.begin(), path.end()))
      });
    });
  }
}

Napi::Value Start(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!info[0].IsString() || !info[1].IsFunction()) {
    Napi::TypeError::New(env, "Expected (string, function)").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string dir = info[0].As<Napi::String>();
  Napi::Function cb = info[1].As<Napi::Function>();

  tsfn = Napi::ThreadSafeFunction::New(env, cb, "WatcherCallback", 0, 1);

  std::thread([dir](){
    WatchDirectory(std::wstring(dir.begin(), dir.end()), EmitEvent);
  }).detach();

  return env.Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("start", Napi::Function::New(env, Start));
  return exports;
}

NODE_API_MODULE(watcher, Init)
