'use strict';

// # All
// /^npm-debug\.log$/,           // npm error log
// /^\..*\.swp$/,                // Vim state

// # macOS
// /^\.DS_Store$/,               // Stores custom folder attributes
// /^\.AppleDouble$/,            // Stores additional file resources
// /^\.LSOverride$/,             // Contains the absolute path to the app to be used
// /^Icon\r$/,                   // Custom Finder icon: http://superuser.com/questions/298785/icon-file-on-os-x-desktop
// /^\._.*/,                     // Thumbnail
// /^\.Spotlight-V100(?:$|\/)/,  // Directory that might appear on external disk
// /\.Trashes/,                  // File that might appear on external disk
// /^__MACOSX$/,                 // Resource fork

// # Linux
// /~$/,                         // Backup file

// # Windows
// /^Thumbs\.db$/,               // Image file cache
// /^ehthumbs\.db$/,             // Folder config file
// /^Desktop\.ini$/              // Stores custom folder attributes
// /^@eaDir$/                    // Synology Diskstation "hidden" folder where the server stores thumbnails

exports.regex = exports.re = /^npm-debug\.log$|^\..*\.swp$|^\.DS_Store$|^\.AppleDouble$|^\.LSOverride$|^Icon\r$|^\._.*|^\.Spotlight-V100(?:$|\/)|\.Trashes|^__MACOSX$|~$|^Thumbs\.db$|^ehthumbs\.db$|^Desktop\.ini$|^@eaDir$/;

exports.is = filename => exports.re.test(filename);

exports.not = filename => !exports.is(filename);
