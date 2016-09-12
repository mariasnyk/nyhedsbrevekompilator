/*jshint node: true */
'use strict';

var http = require('http'),
    https = require('https'),
    moment = require('moment');


module.exports.getIdentities = function (callback) {
  callSendGrid('/api/newsletter/identity/list.json', standardCallback(callback));
};

module.exports.getIdentity = function (identity, callback) {
  callSendGrid('/api/newsletter/identity/get.json', 'identity=' + identity, standardCallback(callback));
};


module.exports.getLists = function (callback) {
  callSendGrid('/api/newsletter/lists/get.json', standardCallback(callback));
};


module.exports.getList = function (list, callback) {
  callSendGrid('/api/newsletter/lists/get.json', 'list=' + list, standardCallback(callback));
};


module.exports.getCategories = function (callback) {
  callSendGrid('/api/newsletter/category/list.json', standardCallback(callback));
};


module.exports.getStats = function (search, callback) {
  callSendGridV3('GET', '/v3/categories/stats' + search, standardCallback(callback));
};


module.exports.getEmails = function (name, callback) {
  if (callback === undefined && typeof name === 'function') {
    callback = name;
    name = null;
  }

  var body = name ? 'name=' + encodeURIComponent(name) : '';

  callSendGrid('/api/newsletter/newsletter/list.json', body, standardCallback(callback));
};


module.exports.getEmail = function (name, callback) {
  callSendGrid('/api/newsletter/newsletter/get.json', 'name=' + encodeURIComponent(name), standardCallback(callback));
};


module.exports.deleteEmail = function (name, callback) {
  console.log(Date().toString(), 'Deleting email ' + name);
  callSendGrid('/api/newsletter/delete.json', 'name=' + encodeURIComponent(name), standardCallback(callback));
};


module.exports.getEmailSchedule = function (name, callback) {
  callSendGrid('/api/newsletter/schedule/get.json', 'name=' + encodeURIComponent(name), standardCallback(callback));
};


module.exports.deleteEmailSchedule = function (name, callback) {
  console.log(Date().toString(), 'Deleting schedule ' + name);
  callSendGrid('/api/newsletter/schedule/delete.json', 'name=' + encodeURIComponent(name), standardCallback(callback));
};


function standardCallback (callback) {
  return function (err, data) {
    if (err) {
      console.log(Date().toString(), err);
      callback(err);
    } else {
      callback(null, data);
    }
  };
}


module.exports.createAndScheduleMarketingEmail = function (newsletter, callback) {

  createMarketingEmail(newsletter, function (err, result) {
    if (err) return callback(err);

    addSendGridSchedule(newsletter.name, newsletter.at, newsletter.after, function (err) {
      if (err) callback(err);
      else {
        callback(null, { message: 'Sent' });
      }
    });
  });
};


function createMarketingEmail (newsletter, callback) {

  addSendGridMarketingEmail(newsletter.identity, newsletter.name, newsletter.subject, newsletter.email_plain, newsletter.email_html, function (err, result) {
    if (err) {
      console.log(Date().toString(), 'Error when creating marketing email ' + newsletter.name, err);
      return callback(err);
    }

    console.log(Date().toString(), 'Marketing email ' + newsletter.name + ' created.' );

    // Adding the newsletter name as a mandatory category
    if (newsletter.categories === undefined || newsletter.categories === null) {
      newsletter.categories = [];
    }

    newsletter.categories.forEach(function (category) {
      addSendGridCategory(category, newsletter.name);
    });

    addSendGridRecipients(newsletter.list, newsletter.name, function (err, result) {
      if (err) {
        console.log(Date().toString(), 'Error when adding recipients to marketing email ' + newsletter.name, err);
        return callback(err);
      }

      console.log(Date().toString(), 'Recipients ' + newsletter.list + ' to email ' + newsletter.name + ' added.');

      callback(null, result);
    });
  });
}
module.exports.createMarketingEmail = createMarketingEmail;


function createSendGridCategory (category, callback) {

  var body = 'category=' + encodeURIComponent(category);
  callSendGrid('/api/newsletter/category/create.json', body, callback);
}


function addSendGridCategory (category, name, callback) {

  var body =
    'category=' + encodeURIComponent(category) +
    '&name=' + encodeURIComponent(name);

  callSendGrid('/api/newsletter/category/add.json', body, function (err, data) {

    if (err) {
      // Example: {"error": "Category donkey1 does not exist"}
      if (err.error == 'Category ' + category + ' does not exist') {
        createSendGridCategory(category, function (err, data) {
          addSendGridCategory (category, name, callback);
        });
      } else if (callback !== undefined && typeof callback === 'function' ) {
        callback(err, null);
      }
    } else if (callback !== undefined && typeof callback === 'function' ) {
      callback (null, data);
    }
  });
}


function addSendGridMarketingEmail (identity, name, subject, text, html, callback) {

  var body =
    'identity=' + identity +
    '&name=' + encodeURIComponent(name) +
    '&subject=' + encodeURIComponent(subject) +
    '&text=' + encodeURIComponent(text) +
    '&html=' + encodeURIComponent(html);

  callSendGrid('/api/newsletter/add.json', body, callback);
}


function addSendGridRecipients (list, name, callback) {

  var body =
    'list=' + encodeURIComponent(list) +
    '&name=' + encodeURIComponent(name);

  callSendGrid('/api/newsletter/recipients/add.json', body, callback);
}

function addSendGridSchedule (name, at, after, callback) {

  if (typeof after === 'function' && callback === undefined) {
    callback = after;
    after = null;
  } else if (typeof at === 'function' && after === undefined && callback === undefined) {
    callback = at;
    at = null;
  }

  var body = 'name=' + encodeURIComponent(name);

  if (at !== undefined && at !== null) {
    var temp = moment(at);

    if (temp.isValid()) {
      if (moment().isBefore(temp)) {
        body = body + '&at=' + temp.toISOString();
        console.log(Date().toString(), 'Scheduling email ' + name + ' at ' + at);
      } else {
        console.log(Date().toString(), 'Scheduling email ' + name + ' now because ' + at + ' is in the past.');
      }
    } else {
      return callback({ message: 'Field at (' + at + ') is not a valid ISO date.' });
    }
  } else if (after !== undefined && after !== null) {
    var temp = Number.parseInt(after);

    if (isNaN(temp) || temp < 0) {
      return callback({ message: 'Field after (' + after + ') is not a valid positive number.' });
    } else {
      body = body + '&after=' + temp.toString();
      console.log(Date().toString(), 'Scheduling email ' + name + ' after ' + after);
    }
  } else {
    console.log(Date().toString(), 'Scheduling email ' + name + ' now');
  }

  callSendGrid('/api/newsletter/schedule/add.json', body, callback);
}


function callSendGrid (path, body, callback) {
  if (callback === undefined && typeof body === 'function') {
    callback = body;
    body = '';
  }

  if (body === null)
    body = '';
  else if (body !== '')
    body = body + '&';

  body = body + 'api_user=' + encodeURIComponent(process.env.SENDGRID_API_USER) + '&api_key=' + encodeURIComponent(process.env.SENDGRID_API_KEY);

  var options = {
    hostname: 'api.sendgrid.com',
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  var req = https.request(options, parseReponse(callback));

  req.write(body);
  req.end();

  req.on('error', function (e) {
    console.log(Date().toString(), 'Error on request to ' + path, e);
    callback(e);
  });
}


function callSendGridV3 (method, path, body, callback) {
  if (callback === undefined && typeof body === 'function') {
    callback = body;
    body = '';
  }

  var authorization = new Buffer(process.env.SENDGRID_API_USER + ':' + process.env.SENDGRID_API_KEY).toString('base64');

  var options = {
    hostname: 'api.sendgrid.com',
    port: 443,
    path: path,
    method: method,
    headers: {
      'Authorization': 'Basic ' + authorization
    }
  };

  var req = https.request(options, parseReponse(callback));

  req.write(body === null ? '' : body);
  req.end();

  req.on('error', function (e) {
    console.log(Date().toString(), 'Error on request to ' + path, e);
    callback(e);
  });
}


function parseReponse (callback) {
  return function (res) {
    var data = '';

    res.on('data', function(d) {
      data = data + d;
    });

    res.on('end', function () {
      try {
        data = JSON.parse(data);
      } catch (ex) {
        console.log('JSON parse error on: ', data);
        throw ex;
      }

      if (data.error || res.statusCode > 300) {
        data.statusCode = res.statusCode;
        callback(data, null);
      }
      else
        callback(null, data);
    });
  };
}
