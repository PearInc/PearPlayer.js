{
  'targets': [
    {
      'target_name': 'bufferutil',
      'include_dirs': ["<!(node -e \"require('nan')\")"],
      'sources': [ 'src/bufferutil.cc' ],
      'xcode_settings': {
        'MACOSX_DEPLOYMENT_TARGET': '10.8',
        'CLANG_CXX_LANGUAGE_STANDARD': 'c++11',
        'CLANG_CXX_LIBRARY': 'libc++'
      }
    }
  ]
}
