
// 获取 gulp
var gulp = require('gulp'),
    // js 压缩插件 （用于压缩 JS）
    uglify = require('gulp-uglify'),
    // 压缩css插件
    minifyCSS = require('gulp-minify-css'),
    // 获取 gulp-imagemin 模块
    imagemin = require('gulp-imagemin'),
    // 压缩html插件
    htmlmin = require('gulp-htmlmin'),
    // 合并文件
    concat = require("gulp-concat"),
    // html 文件对合并文件后的替换处理插件
    htmlReplace = require("gulp-html-replace"),
    // 复制文件（文件拷贝）
    copy = require('copy'),
    // 清除文件
    del = require('del'),

    rename = require('gulp-rename');
// 版本号
var APP_VERSION = 'v.1.0';
// 1. 清除旧部署文件；
gulp.task('clean', function(cb){
    del(['dest/*']);
    cb();
});

// 3.压缩 js 文件；（包括合并操作， 多个js文件压缩成一个文件）
gulp.task('uglifyjs', function(){
    // 1. 找到文件
    // gulp.src(['datas/*.js'])
    // // 2. 压缩文件
    //     .pipe(uglify())
    //     // 3. 合并成一个文件
    //     .pipe( concat('datas.js') )
    //     // 4. 另存压缩后的文件
    //     .pipe( gulp.dest('dest/datas/') );

    gulp.src('./pear-player.js')
        .pipe(uglify())
        .pipe(rename({suffix:'.min'}))
        .pipe( gulp.dest('./dest/') );

});

// 默认任务(组合任务)
// gulp.task('default', ['clean'], function(){
//     gulp.start('copy', 'uglifyjs', 'cssmin', 'imagemin', 'htmlmin');
// });
gulp.task('default', ['clean'], function(){
    gulp.start('uglifyjs');
});