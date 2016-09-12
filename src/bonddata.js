/*jshint node: true */
'use strict';

module.exports.register = function (plugin, options, next) {

  plugin.route({
    method: 'GET',
    path: '/',
    config: {
      validate: {
        query: {
          u: Joi.string().uri()
        }
      }
    },
    handler: function (request, reply) {
    if (request.query.u) {
        getDataFromBond(request.query.u, function (err, data) {
          if (err) return reply(err).code(500);
          if (data === null) return reply().code(404);

          reply(data);
        });
      } else {
        return reply().code(400);
      }
    }
  });

  next();
};

module.exports.register.attributes = {
    name: 'bonddata',
    version: '1.0.0'
};


function getDataFromBond (url, callback) {
  download(url, function (err, data) {
    if (err) {
      callback(err);
    } else if (data === null) {
      callback({ message: 'Invalind data' });
    } else if (data.type !== undefined && ['nodequeue', 'latest_news', 'news_article'].indexOf(data.type) > -1) {
      orderBondImages(data);
      data.subject = subjectSuggestion(data);
      addPaywallToken(data);
      callback(null, data);
    // } else if (data.type === 'nodequeue' && data.nodes.length === 0 ) {
      // callback(null, null);

      // Example of a response from a nodequeue that doesn't exist
      //   { type: 'nodequeue',
      //     id: '4222222626',
      //     loadType: 'fullNode',
      //     title: null,
      //     nodes: [] }
    } else {
      callback(null, data);
    }
  });
}
module.exports.get = getDataFromBond;


function download (url, callback) {
  http.get(url, function( response ) {

    if (response.statusCode === 401) {
      return callback (null, null);
    } else if (response.statusCode === 302) {
      return download (response.headers.location, callback);
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


function orderBondImages (data) {
  if (data === null) return;

  if (data.type === 'nodequeue' || data.type === 'latest_news') {
    for (var i = data.nodes.length - 1; i >= 0; i--) {
      orderBondImages(data.nodes[i]);
    };
  } else if (data.images !== undefined && data.images !== null && Object.prototype.toString.call( data.images ) === '[object Object]') {
    var images = [];
    Object.keys(data.images).forEach(function (key) {
      images.push(data.images[key]);
    });
    delete data.images;
    data.images = images.sort(sortImages);
  }
}


function sortImages(bondImageA, bondImageB) {
  if (bondImageA.position < bondImageB.position) {
    return -1;
  } else if (bondImageA.position > bondImageB.position) {
    return 1;
  } else {
    return 0;
  }
}


function subjectSuggestion (data) {
  if (data === null) return '';
  var maxLength = 255;

  if (data.type === 'nodequeue' || data.type === 'latest_news') {
    var temp = [];
    for (var i = 0; i < 3; i++) {
      if (data.nodes[i] && data.nodes[i].title) {
        temp.push(data.nodes[i].title);
      }
    }
    return temp.join(' | ').substring(0, maxLength);
  } else {
    return data.title.substring(0, maxLength);
  }
}


function addPaywallToken (node) {
  if (node.type === 'nodequeue' || node.type === 'latest_news') {
    node.nodes.forEach(addPaywallToken);
  } else {
    node.newsl_access = calculatePaywallToken(node.id);
  }
}


function calculatePaywallToken (nid) {
  var timestamp = Date.now();
  var token = checksum(nid.toString() + timestamp + process.env.PAYWALL_TOKEN_SALT, { algorithm: 'sha256' });
  var newsl_access = new Buffer(nid.toString() + '|' + timestamp + '|' + token).toString('base64');
  return newsl_access;
}
