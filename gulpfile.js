var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    jshint = require('gulp-jshint'),
    spawn = require('child_process').spawn;


gulp.task('default', ['serve']);

var node;
gulp.task('start', function() {
  if (node) {
    node.kill();
  }
  node = spawn('node', ['./src/server.js'], {stdio: 'inherit'});
});

var node_inspector;
gulp.task('debug', function() {
  if (node) {
    node.kill();
  }
  node = spawn('node', ['--debug=5858', './src/server.js'], {stdio: 'inherit'});

  if (node_inspector) {
    node_inspector.kill();
  }
  node_inspector = spawn('node-inspector', ['--web-port=8080'], {stdio: 'inherit'});
});

gulp.task('serve', ['start'], function () {
  gulp.watch(['./src/*.js', './src/apis/**/*.js'], ['start']);
});

// Browser-sync virker ikke med et statisk website fra Express/Hapi
gulp.task('browser-sync', function () {
  browserSync({
    notify: false,
    server: {
      baseDir: './src/admin/'
    }
  });
  gulp.watch(['./src/admin/**'], browserSync.reload);
});

gulp.task('lint', function() {
  gulp.src('./src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('build', ['lint', 'test'], function() {
  // TODO
});
