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

gulp.task('lint', function() {
  gulp.src('./src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('build', ['lint', 'test'], function() {
  // TODO
});

var swig = require('swig'),
    extras = require('swig-extras'),
    path = require('path'),
    fs = require ('fs'),
    http = require ('http');

swig.setDefaults({ cache: false });
extras.useFilter(swig, 'split');
extras.useFilter(swig, 'trim');
extras.useFilter(swig, 'truncate');

/*
  Use the task "testdata" to create a JSON-file with data from BOND.
    Make sure the testdata filename follows the format: <templateName>.json
  Use the task "tests" to render the templates.
    Each template used testdata from <templateName>.json
*/


gulp.task('testdata', function () {

  downloadTestdata('http://edit.berlingskemedia.net.white.bond.u.net/bondapi/nodequeue/5857.ave-json?image_preset=620x355-c', 'bt_mode.html.json');
  downloadTestdata('http://edit.berlingskemedia.net.white.bond.u.net/bondapi/nodequeue/31.ave-json?image_preset=620x355-c', 'bt_morgen.html.json');

});

gulp.task('tests', function () {
  var templateDir = path.join(__dirname, 'templates');

  render('bt_mode.html');
  render('bt_morgen.html');

  function render (templateName) {
    renderTest(path.join(templateDir, templateName));
  }
});

gulp.task('templating', function () {

  gulp.watch('templates/**/*', render);
  console.log('Watching templates...');

  function render (event) {
    renderTest(event.path);
  }
});

gulp.task('listing', ['templating'], function () {
  var Hapi = require('hapi');

  var server = new Hapi.Server();
  server.connection({ port: 8080 });

  server.route({
      method: 'GET',
      path: '/{param*}',
      handler: {
          directory: {
              path: 'tests',
              listing: true
          }
      }
  });

  server.start(function () {
      console.log('Server running at:', server.info.uri);
  });
});

function renderTest (templatePath) {
  var templateName = path.basename(templatePath),
      testsDir = path.join(__dirname, 'tests'),
      rendered_testname = path.join(testsDir, templateName),
      testdata = path.join(__dirname, 'testdata', templateName + '.json');

  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir);
  }

  if (!fs.existsSync(testdata)) {
    console.warn('Testdata', testdata, 'not found');
    return;
  }

  fs.writeFileSync(rendered_testname, swig.renderFile(templatePath, require(testdata)));
  console.log(rendered_testname, 'updated');
}

function downloadTestdata (url, filename) {
  console.log('Downloading', url, 'as', filename);

  var testdataDir = path.join(__dirname, 'testdata');

  if (!fs.existsSync(testdataDir)) {
    fs.mkdirSync(testdataDir);
  }

  http.get(url, function( response ) {

    if (response.statusCode !== 200) {
      console.error('Got response error', response.statusCode, 'on', url);
      return;
    }

    var data = '';
    response.setEncoding('utf8');

    response.on('data', function ( chunk ) {
      data += chunk;
    });

    response.on('end', function() {
      fs.writeFileSync(path.join(testdataDir, filename), data);
      console.log('Testdata', filename, 'written');
    });
  }).on('error', function(e) {
    console.error('Got error while requesting HTML (' + url + '): ' + e.message);
  });
}
