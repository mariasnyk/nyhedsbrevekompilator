var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    spawn = require('child_process').spawn,
    path = require('path'),
    fs = require ('fs'),
    http = require ('http'),
    swig = require('./src/swig_helper.js'),
    examplesDir = path.join(__dirname, 'examples'),
    templatesDir = path.join(__dirname, 'templates'),
    testdataDir = path.join(__dirname, 'testdata');


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

/*
  Use the task "testdata" to create a JSON-file with data from BOND.
    Make sure the testdata filename follows the format: <templateName>.json
  Use the task "tests" to render the templates.
    Each template used testdata from <templateName>.json
*/

gulp.task('templating', ['examples'], function () {
  gulp.watch('templates/*/*', function (event) {
    renderAllExamples();
  });

  gulp.watch('templates/*', function (event) {
    renderExample(event.path);
  });

  console.log('Watching templates...');
});


gulp.task('testdata', function () {
  downloadTestdata('http://edit.berlingskemedia.net.white.bond.u.net/bondapi/nodequeue/5857.ave-json?image_preset=620x355-c', 'bt_mode.html.json');
  downloadTestdata('http://edit.berlingskemedia.net.white.bond.u.net/bondapi/nodequeue/31.ave-json?image_preset=620x355-c', 'bt_morgen.html.json');
  downloadTestdata('http://edit.berlingskemedia.net.white.bond.u.net/bondapi/nodequeue/102.ave-json?image_preset=620x355-c', 'bt_nyheder.html.json');
});

gulp.task('examples', function () {
  renderAllExamples();
});


function renderAllExamples () {

  console.log('Rendering all examples...');

  fs.readdirSync(templatesDir).forEach(function (file) {
    var templatePath = path.join(templatesDir, file);
    if (fs.statSync(templatePath).isFile()) {
      renderExample(templatePath);
    }
  });
}

function renderExample (templatePath) {

  console.log('Rendering', templatePath);

  var templateName = path.basename(templatePath),
      testdata = path.join(testdataDir, templateName + '.json');
      

  if (!fs.existsSync(testdata)) {
    console.error('Testdata', testdata, 'not found');
    return;
  }

  if (!fs.existsSync(examplesDir)) {
    fs.mkdirSync(examplesDir);
  }

  var exampleName = path.join(examplesDir, templateName);

  fs.writeFileSync(exampleName, swig.renderFile(templatePath, require(testdata)));
  console.log(exampleName, 'updated');
}

function downloadTestdata (url, filename) {
  console.log('Downloading', url, 'as', filename);

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
