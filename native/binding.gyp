{
  "targets": [
    {
      "target_name": "watcher",
      "sources": [
        "watcher.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<(module_root_dir)/efsw/include"
      ],
      "libraries": [
        "<(module_root_dir)/efsw/build/Release/efsw.lib"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS",
        "EFSLIB_DYNAMIC"
      ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "RuntimeLibrary": 3
        }
      }
    }
  ]
}
