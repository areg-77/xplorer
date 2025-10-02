{
  "targets": [
    {
      "target_name": "watcher",
      "sources": [ "watcher.cc", "winWatcher.cpp" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cxxflags!": [ "-fno-exceptions" ],
      "cxxflags": [ "-std=c++17", "-fexceptions" ],
      "msvs_settings": {
        "VCCLCompilerTool": { "ExceptionHandling": 1 }
      }
    }
  ]
}
