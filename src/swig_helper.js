/*jshint node: true */
'use strict';

var swig = require('swig'),
    extras = require('swig-extras'),
    moment = require('moment');

moment.locale('da');

extras.useFilter(swig, 'split');
extras.useFilter(swig, 'trim');
extras.useFilter(swig, 'truncate');

swig.setDefaults({ cache: false }); /* must be turned of when in production*/

swig.setFilter('highlighter', function (input, highlight) {
  if (highlight === null || highlight === 0) {
    return input;
  } else {
    var words = input.split(' ');
    return {
      highlights: words.slice(0, highlight).join(' '),
      rest: words.slice(highlight).join(' ')
    };
  }
});

swig.setFilter('moment', function (format, date) {
  return moment(date).format(format === undefined || format === '' ? 'ddd D MMM' : format);
});

swig.setFilter('tracking', function (format, after, at) {
  format = format === undefined || format === '' ? 'YYYYMMDD' : format;
  if (after) {
    return moment().add(after, 'minutes').format(format);
  } else if (at) {
    return moment(at).format(format);
  } else {
    return moment().format(format);
  }
});

module.exports = swig;