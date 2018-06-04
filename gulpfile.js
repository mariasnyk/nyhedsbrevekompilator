const gulp = require('gulp');
const jshint = require('gulp-jshint');
const spawn = require('child_process').spawn;
const path = require('path');

var node;

gulp.task('default', ['serve']);

gulp.task('start', function() {
  if (node) {
    node.kill();
  }
  node = spawn('node', ['./server/index.js'], {stdio: 'inherit'});
});

var node_inspector;
gulp.task('debug', function() {
  if (node) {
    node.kill();
  }
  node = spawn('node', ['--debug=5858', './server/index.js'], {stdio: 'inherit'});

  if (node_inspector) {
    node_inspector.kill();
  }
  node_inspector = spawn('node-inspector', ['--web-port=8080'], {stdio: 'inherit'});
});

gulp.task('serve', ['start'], function () {
  gulp.watch(['./server/**/*.js'], ['start']);
});

gulp.task('lint', function() {
  gulp.src('./server/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('build', ['lint', 'test'], function() {
  // TODO
});
