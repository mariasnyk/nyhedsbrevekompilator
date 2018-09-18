/*jshint node: true */
'use strict';

const swig = require('swig');
const extras = require('swig-extras');
const moment = require('moment');

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


// Usage eg.
//  node.taxonomyTags.presentationTags | hasTag("334794", "id")
//  node.taxonomyTags.presentationTags | hasTag("www.b.dk > Artikel > I abonnement", "fullName")
swig.setFilter('hasTag', function(tags, tagValue, tagField){

  if (!tags instanceof Array || typeof tags === 'string') {
    return false;
  }

  if (tagValue === undefined || tagValue === null) {
    return false;
  }

  if(tagField === undefined){
    tagField = 'id';
  }

  return tags.some(function(tag){
    return tag[tagField] === tagValue;
  });
});

swig.setFilter('typeof', function (variable) {
  return Object.prototype.toString.call( variable );
});


swig.setFilter('stringreplace', function (input, substr, newSubStr) {
  return input.replace(substr, newSubStr);
});


module.exports = swig;
