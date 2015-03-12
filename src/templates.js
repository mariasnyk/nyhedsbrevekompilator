'use strict';

var fs = require('fs'),
    path = require('path'),
    http = require('http'),
    url = require('url'),
    swig = require('swig'),
    extras = require('swig-extras'),
    checksum = require('checksum'),
    templateDir = path.join(__dirname, '/../templates');


    // templateDir = '/home/dako/Code/sii-newsletter/templates';

extras.useFilter(swig, 'split');
extras.useFilter(swig, 'trim');
extras.useFilter(swig, 'truncate');

swig.setDefaults({ cache: false }); /* must be turned of when in production*/


module.exports.register = function (plugin, options, next) {

  plugin.select('templates').views({
    engines: {
      html: swig,
      plain: swig
    },
    path: templateDir,
    isCached: false /* must be turned of when in production*/
  });

  plugin.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      fs.stat(templateDir, function (err, stat) {
        if (err) return reply().code(404);
        if (!stat.isDirectory()) return reply().code(500);

        fs.readdir(templateDir, function (err, files) {
          reply(files
            .filter(function (file) {
              console.log(templateDir, file);
              return fs.statSync(path.join(templateDir, file)).isFile() &&
                (request.query.filter !== undefined ?
                  file.indexOf(request.query.filter) > -1 :
                  true);
            })
            .map(function (file) {
              return file;
            }));
        });
      });
    }
  });

  plugin.route({
    method: 'GET',
    path: '/{template*}',
    handler: function (request, reply) {
      var templatePath = fs.realpathSync(path.join(templateDir, request.params.template));

      if (!fs.existsSync(templatePath))
        return reply().code(404);

      fs.stat(templatePath, function (err, stat) {
        if (err) return reply().code(404);

        if (!stat.isFile()) return reply().code(500);

        // Requesting a specific template with a BOND node as data input
        if (request.query.u) {

          // Validate the url
          var uri = url.parse(request.query.u);
          if (uri.protocol === null || uri.host === null) {
            return reply({message: 'Url invalid'}).code(400);
          }

          var controlroom_url = getControlroomUrl(uri);

          download(request.query.u, function (err, data) {
            if (err) return reply(err).code(500);

            // Example of a response from a nodequeue that doesn't exist
            //   { type: 'nodequeue',
            //     id: '4222222626',
            //     loadType: 'fullNode',
            //     title: null,
            //     nodes: [] }

            if (data === null || ( data.type === 'nodequeue' && data.nodes.length === 0 )) {
              return reply().code(404);
            }

            data.subject = emailSubjectSuggestion(data);
            data.dates = getDates();

            if (request.query.debug) {
              // TODO: What can we do the make the template debugging easier?
            }

            reply
            .view(request.params.template, data)
            .header('Transfer-Encoding', 'chunked')
            .header('Content-Type', ContentTypeHeader(request.params.template))
            .header('X-Subject-Suggestion', encodeURIComponent(data.subject))
            .header('X-Content-Checksum', calculateChecksum(data))
            .header('X-Controlroom-url', encodeURIComponent(controlroom_url));
          });

        } else {
          reply
          .view(request.params.template)
          .header('Content-Type', ContentTypeHeader(request.params.template))
        }
      });
    }
  });

  plugin.route({
    method: 'POST',
    path: '/{template*}',
    handler: function (request, reply) {

      // If the request URL ends without a filename
      if (request.params.template.charAt(request.params.template.length - 1) === '/')
        reply().code(400);

      // Creating all directories in the request URL recursive
      var dirs = request.params.template.split('/').slice(0,-1);
      dirs.forEach(function (dir, index) {
        var newDir = path.join(templateDir, dirs.slice(0, index + 1).join('/'));
        if (!fs.existsSync(newDir))
          fs.mkdirSync(newDir);
      });

      fs.writeFile(path.join(templateDir, request.params.template), request.payload, function (err) {
        if (err) reply().code(500);
        else reply();
      });
    }
  });

  plugin.route({
    method: 'DELETE',
    path: '/{template*}',
    handler: function (request, reply) {

      if (request.params.template === undefined || request.params.template.charAt(request.params.template.length - 1) === '/')
        reply().code(400);

      var templatePath = fs.realpathSync(path.join(templateDir, request.params.template));

      if (fs.existsSync(templatePath)) {
        fs.unlink(templatePath, function (err) {
          if (err) reply().code(500);
          else reply();
        });
      } else {
        reply().code(404);
      }
    }
  });

  plugin.route({
    method: 'get',
    path: '/controlroom',
    handler: function (request, reply) {
      if (request.query.u) {

        var controlroom_url = getControlroomUrl(url.parse(request.query.u));

        reply({ url: controlroom_url })
        .header('X-Controlroom-url', encodeURIComponent(controlroom_url));

      } else {
        return reply().code(400);
      }
    }
  });

  next();
};

module.exports.register.attributes = {
    name: 'templates',
    version: '1.0.0'
};


function download (url, callback) {

  http.get(url, function( response ) {

    if (response.statusCode === 401) {
      return callback (null, null);
    } else if (response.statusCode !== 200) {
      return callback (response.statusCode, null);
    }

    var data = '';
    response.setEncoding('utf8');

    response.on('data', function ( chunk ) {
      data += chunk;
    });

    response.on('end', function() {
      callback(null, JSON.parse(data), response.headers);
    });
  }).on('error', function(e) {
    console.log('Got error while requesting HTML (' + url + '): ' + e.message);
    callback(e, null);
  });
}


function emailSubjectSuggestion (data) {
  if (data === null) return '';
  var maxLength = 255;

  if (data.type === 'nodequeue') {
    var temp = [];
    for (var i = 0; i < 3; i++) {
      temp.push(data.nodes[i].title);
    }
    return temp.join(' | ').substring(0, maxLength);
  } else {
    return data.title.substring(0, maxLength);
  }
}


function ContentTypeHeader (template) {
  if (template.slice(-5) === '.html') {
    return 'text/html; charset=utf-8';
  } else {
    return 'text/plain; charset=utf-8';
  }
}


function calculateChecksum (data) {
  if (data === null) return '';
  if (data.type === 'nodequeue') {

    var temp = data.nodes.map(function (node) {
      return node.id;
    });

    return checksum(JSON.stringify(temp));

  } else {
    return checksum(JSON.stringify(data.id));
  }
}


function calculatePaywallToken (nid) {
  var timestamp = Date.now();
  var token = checksum(nid.toString() + timestamp + process.env.PAYWALL_TOKEN_SALT, { algorithm: 'sha256' });
  var newsl_access = new Buffer(nid.toString() + '|' + timestamp + '|' + token).toString('base64');
  return newsl_access;
}

function getControlroomUrl (bond) {
  var bond_base_url = '';

  if (bond.host.indexOf('edit.') === 0) {
    bond_base_url = bond.protocol + '//' + bond.host;
  } else if (bond.host.substr(-3) === '.dk') {
    bond_base_url = bond.protocol + '//edit.berlingskemedia.net';
  }

  var id = bond.path.substring(bond.path.lastIndexOf('/') + 1, bond.path.indexOf('.ave-json'));

  if (bond.path.indexOf("/bondapi/nodequeue/") === 0) {
    return bond_base_url + '/admin/content/nodequeue/' + id + '/view';
  } else if (bond.path.indexOf("/bondapi/node/") === 0) {
    return bond_base_url + '/node/' + id + '/view';
  } else {
    return '';
  }
}

function getDates () {
  var temp = new Date();
  return {
    year: temp.getFullYear(),
    date: temp.getDate().toString(),
    yyyymmdd: temp.getFullYear() +
              ('0' + (temp.getMonth() + 1)).slice(-2) +
              ('0' + temp.getDate()).slice(-2),
    day: danishWeekdayName(temp.getDay()),
    month: danishMonthName(temp.getMonth() + 1),
    unix_timestap: temp.getTime()
  }
}

function danishWeekdayName (day) {
  switch (day) {
    case 1: return 'Mandag';
    case 2: return 'Tirsdag';
    case 3: return 'Onsdag';
    case 4: return 'Torsdag';
    case 5: return 'Fredag';
    case 6: return 'Lørdag';
    case 7: return 'Søndag';
  }
}

function danishMonthName (month) {
  switch (month) {
    case 1: return 'Januar';
    case 2: return 'Februar';
    case 3: return 'Marts';
    case 4: return 'April';
    case 5: return 'Maj';
    case 6: return 'Juni';
    case 7: return 'Juli';
    case 8: return 'August';
    case 9: return 'September';
    case 10: return 'Oktober';
    case 11: return 'November';
    case 12: return 'December';
  }
}