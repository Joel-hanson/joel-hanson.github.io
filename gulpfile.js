var gulp = require('gulp');
var sync = require('browser-sync').create();

gulp.task('serve',function(){
sync.init({
server:{
baseDir:'./'
},
})
gulp.watch('./*/*.*').on('change',sync.reload);
gulp.watch('./*.*').on('change',sync.reload);

});
gulp.task('build',function(){
sync.init({
server:{
baseDir:'./build/es6-bundled'
},
})
gulp.watch('./*/*.*').on('change',sync.reload);
gulp.watch('./*.*').on('change',sync.reload);

});
gulp.task('default',function(){
sync.init({
server:{
baseDir:'./build/default'
},
})
gulp.watch('./*/*.*').on('change',sync.reload);
gulp.watch('./*.*').on('change',sync.reload);

});