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

swig.setFilter('unix', function (timestamp, format) {
  return moment.unix(timestamp).format(format === undefined || format === '' ? 'ddd D MMM' : format);
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

swig.setFilter('yyyymmdd', function (timestamp) {
  if (timestamp === '') {
    return moment().format('YYYYMMDD');
  } else {
    return moment.unix(timestamp).format('YYYYMMDD');
  }
});

swig.setFilter('hasValue', function (listOfValues, value) {
  return Object.prototype.toString.call(listOfValues) !== '[object Array]' ?
    false :
    listOfValues.indexOf(value) > -1;
});

swig.setFilter('tagValue', function(inputTags, tagName){
  if(inputTags === undefined || inputTags === null || Object.prototype.toString.call(inputTags) !== '[object Array]') {
    return;
  }

  var tag = inputTags.find(function(t){
    return t.indexOf(tagName) === 0;
  });

  if(tag){
    return tag.split(':')[1];
  }
});

swig.setFilter('typeof', function (variable) {
  return Object.prototype.toString.call( variable );
});


swig.setFilter('stringreplace', function (input, substr, newSubStr) {
  console.log('stringreplace', input, substr, newSubStr);
  console.log('ss', input.replace(substr, newSubStr));
  return input.replace(substr, newSubStr);
});


module.exports = swig;
