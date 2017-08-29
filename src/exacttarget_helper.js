/*jshint node: true */
'use strict';

var https = require('https'),
    clientId = process.env.EXACTTARGET_APP_CLIENT_ID,
    clientSecret = process.env.EXACTTARGET_APP_CLIENT_SECRET,
    authResponse = {};

getExactTargetAuthtoken((response) => {
  console.log('res', response);

  setTimeout(getExactTargetAuthtoken, response.expiresIn * 1000)
});

console.log('Connecting to ExactTarget using ClientID', process.env.EXACTTARGET_APP_CLIENT_ID);


module.exports.getContactsSchema = function (callback) {
  callExactTarget('GET', '/contacts/v1/schema', standardCallback(callback));
};


module.exports.getAttributeSetDefinitions = function (callback) {
  callExactTarget('GET', '/contacts/v1/attributeSetDefinitions', standardCallback(callback));
};


module.exports.getAllContacts = function (options, callback){
  if(callback === undefined && typeof options === 'function'){
    callback = options;
    options = {};
  }
  options.name = 'Contact';
  getAllAttributeSetItems(options, callback);
  // callExactTarget('GET', '/contacts/v1/attributeSets/name:Contact', standardCallback(callback));
};


module.exports.getAllEmailAddresses = function (options, callback){
  if(callback === undefined && typeof options === 'function'){
    callback = options;
    options = {};
  }
  options.name = 'Email Addresses';
  getAllAttributeSetItems(options, callback);
  // callExactTarget('GET', '/contacts/v1/attributeSets/name:Email%20Addresses', standardCallback(callback));
};


module.exports.getAllEmailDemographics = function (options, callback){
  if(callback === undefined && typeof options === 'function'){
    callback = options;
    options = {};
  }
  options.name = 'Email Demographics';
  getAllAttributeSetItems(options, callback);
  // callExactTarget('GET', '/contacts/v1/attributeSets/name:Email%20Demographics', standardCallback(callback));
};


function getAllAttributeSetItems (options, callback){
  if (!options.name){
    return callback(new Error('Option name missing'));
  }

  var query = '';
  if(options.page){
    query = '?$page='.concat(options.page);
  }

  callExactTarget('GET', '/contacts/v1/attributeSets/name:'.concat(encodeURIComponent(options.name), query), itemsValueCallback(callback));
};


// module.exports.getContactKey = function (options, callback) {
//   if (callback === undefined && typeof options === 'function') {
//     return options(new Error('Parameter options missing'));
//   }
//
//   var key = '',
//       value = '';
//
//   if(options.email) {
//     key = 'Email Addresses.Email Address';
//     value = options.email;
//   } else if (options.ekstern_id){
//     key = 'Email Demographics.ExternalId';
//     value = options.ekstern_id;
//   } else {
//     return callback(new Error('Parameter options missing'));
//   }
//
//   var payload = {
//     "conditionSet": {
//       "operator": "And",
//       "conditionSets": [],
//       "conditions": [{
//         "attribute": {
//           "key": key,
//           "id": "",
//           "isCustomerData": false
//         },
//         "operator": "Equals",
//         "value": {
//           "items": [value]
//         }
//       }]
//     }
//   };
//
//   callExactTarget('POST', '/contacts/v1/contacts/search', payload, itemsValueCallback(callback));
// };


module.exports.getContactAttributes = function (options, callback) {
  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  } else if (options === undefined){
    options = {};
  }

  var query = '',
      payload = {
      "request": {
        "attributes": [
          {"key": "Contact.Contact Key"},
          {"key": "Email Addresses.Email Address"},
          {"key": "Email Demographics.Permissions"},
          {"key": "Email Demographics.Newsletters"},
          {"key": "Email Demographics.Interests"},
          {"key": "Email Demographics.FirstName"},
          {"key": "Email Demographics.LastName"},
          {"key": "Email Demographics.Mailoptout"},
          {"key": "Email Demographics.Robinson"},
          {"key": "Email Demographics.Contacts ID"},
          {"key": "Email Demographics.ExternalId"},
          {"key": "Email Demographics.Birthyear"},
          {"key": "Email Demographics.Sex"},
          {"key": "Email Demographics.ZipCode"},
          {"key": "Email Demographics.ZipCodeOther"}
        ]
      },
      "conditionSet": {
          "operator": "And",
          "conditionSets": [],
          "conditions": []
      }
  };

  if (options.user_id) {
    addCondition('Contact.Contact Key', options.user_id);
  } else if(options.contactKey) {
    addCondition('Contact.Contact Key', options.contactKey);
  } else if(options.email) {
    addCondition('Email Addresses.Email Address', options.email);
  } else if (options.ekstern_id){
    addCondition('Email Demographics.ExternalId', options.ekstern_id);
  } else if (options.contactID) {
    addCondition('Email Demographics.Contacts ID', options.contactID);
  } else if (options.sex) {
    addCondition('Email Demographics.Sex', options.sex);
  } else if (options.robinson_flag) {
    addCondition('Email Demographics.Robinson', options.robinson_flag);
  } else if (options.nyhedsbreve) {
    addCondition('Email Demographics.Newsletters', options.nyhedsbreve, 'Contains');
  } else if (options.interesser) {
    addCondition('Email Demographics.Interests', options.interesser, 'Contains');
  } else if (options.permissions) {
    addCondition('Email Demographics.Permissions', options.permissions, 'Contains');
  } else if (options.mailoptouts) {
    addCondition('Email Demographics.Mailoptout', options.mailoptouts, 'Contains');
  }

  if(options.page){
    query = '?$page='.concat(options.page);
  }

  callExactTarget('POST', '/contacts/v1/attributes/search'.concat(query), payload, itemsValueCallback(callback));

  function addCondition(key, value, operator){
    var condition = {
      "attribute": {
          "key": key
      }
    };

    if(value instanceof Array) {
      condition.operator = operator !== undefined ? operator : 'In';
      condition.values = value;
    } else {
      condition.operator = operator !== undefined ? operator : 'Equals';
      condition.value = {
        'items': [value]
      };
    }

    payload.conditionSet.conditions.push(condition);
  }
};


module.exports.createContact = function (data, callback) {
  if (callback === undefined && typeof data === 'function') {
    return data(new Error('Parameter data missing'));
  } else if (data.user === undefined || data.user_id === undefined) {
    return callback(new Error('Parameter user_id missing when creating in contact in ExactTarget'));
  } else if (data.contactKey !== undefined && data.user_id !== undefined) {
    return callback(new Error('Parameter contactKey and user_id cannot both be set'));
  }

  var payload = {
    contactKey: data.user_id,
    attributeSets: createAttributeSets(data.user)
  };

  callExactTarget('POST', '/contacts/v1/contacts', payload, standardCallback(callback));
}


module.exports.updateContact = function (data, callback) {
  if (callback === undefined && typeof data === 'function') {
    return data(new Error('Parameter data missing'));
  } else if (data.contactKey === undefined && data.user_id === undefined) {
    return callback(new Error('Parameter contactKey or user_id missing when updating contact in ExactTarget'));
  } else if (data.contactKey !== undefined && data.user_id !== undefined) {
    return callback(new Error('Parameter contactKey and user_id cannot both be set'));
  }

  if (data.user === undefined){
    data.user = {};
  }
  // } else if (data.contactID) {
  //   // TODO: Find out if it's contactId or contactID.
  //   // Documentation says contactId. But everywhere else it's contactID
  //   payload.contactId = data.contactID;
  //   payload.contactID = data.contactID;

  var payload = {
    contactKey: data.contactKey ? data.contactKey : data.user_id,
    attributeSets: createAttributeSets(data.user)
  };

  callExactTarget('PATCH', '/contacts/v1/contacts', payload, standardCallback(callback));
};


module.exports.deleteContact = function (data, callback) {
  if (callback === undefined && typeof data === 'function') {
    return data(new Error('Parameter data missing'));
  } else if (data.contactKey === undefined && data.user_id === undefined) {
    return callback(new Error('Parameter contactKey or user_id missing when updating contact in ExactTarget'));
  } else if (data.contactKey !== undefined && data.user_id !== undefined) {
    return callback(new Error('Parameter contactKey and user_id cannot both be set'));
  }

  // See documentation:
  // https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/DeleteByContactIDs.htm
  // https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/DeleteByContactKeys.htm

  var payload = {
    ContactTypeId: 0,
    values: [],
    DeleteOperationType: "ContactAndAttributes",
    optionValues: []
  };

  if (data.contactKey !== undefined) {
    payload.values.push(data.contactKey.toString());
  } else if (data.user_id !== undefined) {
    payload.values.push(data.user_id.toString());
  }

  getDeleteOptions(function (err, deleteOptions){
    if (err){
      if (callback === undefined){
        console.error(err);
      } else {
        return callback(err);
      }
    }

    payload.optionValues = deleteOptions.items.map(function(i){
      return {
        adapterID: i.adapterID,
        adapterKey: i.adapterKey,
        values: Object.keys(i.options).map(function(o){
          return {
            iD: i.options[o].iD,
            value: 'True'
          };
        })
      };
    });

    // callExactTarget('POST', '/contacts/v1/contacts/actions/delete?type=ids', payload, standardCallback(callback));
    callExactTarget('POST', '/contacts/v1/contacts/actions/delete?type=keys', payload, standardCallback(callback));
  });
};


module.exports.getDeleteContactStatus =  function(operationID, callback){
  if (callback === undefined && typeof operationID === 'function'){
    return operationID(new Error('Parameter operationID is missing'));
  }

  callExactTarget('GET', '/contacts/v1/contacts/actions/delete/status?operationID='.concat(operationID), standardCallback(callback));
};


function getDeleteOptions(callback) {

  var payload  = {
    context: {
      listType: "audience",
      deleteOperationType: "ContactAndAttributes",
      applicationContext: {
        applicationID: "e25893f9-08f3-480f-8def-7f8ab0583611"
      }
    }
  };

  callExactTarget('POST', '/contacts/v1/contacts/actions/delete/options', payload, standardCallback(callback));
};


function createAttributeSets(user){

  var attributeSetsEmailAddresses = {
    name: "Email Addresses",
    items: [{
      values: []
    }]
  };

  var attributeSetsEmailDemographics = {
    name: "Email Demographics",
    items: [{
      values: []
    }]
  };

  var email = user.email ? user.email : user['Email Address'];
  if (hasValue(email)) {
    attributeSetsEmailAddresses.items[0].values.push(
      { "name": "Email Address", "value": email },
      { "name": "HTML Enabled", "value": true }
    );
  }

  var fornavn = hasValue(user.fornavn) ? user.fornavn : user.FirstName;
  if (hasValue(fornavn)) {
    attributeSetsEmailDemographics.items[0].values.push({ "name": "FirstName", "value": fornavn });
  }

  var efternavn = hasValue(user.efternavn) ? user.efternavn : user.LastName;
  if (hasValue(efternavn)) {
    attributeSetsEmailDemographics.items[0].values.push({ "name": "LastName", "value": efternavn });
  }

  var mailoptouts = hasValue(user.mailoptouts) ? user.mailoptouts : user.Mailoptout;
  if (hasValue(mailoptouts)) {
    attributeSetsEmailDemographics.items[0].values.push({ "name": "Mailoptout", "value": mailoptouts });
  }

  var nyhedsbreve = hasValue(user.nyhedsbreve) ? user.nyhedsbreve : user.Newsletters;
  if (hasValue(nyhedsbreve)) {
    attributeSetsEmailDemographics.items[0].values.push({ "name": "Newsletters", "value": nyhedsbreve });
  }

  var interesser = hasValue(user.interesser) ? user.interesser : user.Interests;
  if (hasValue(interesser)) {
    attributeSetsEmailDemographics.items[0].values.push({ "name": "Interests", "value": interesser });
  }

  var permissions = hasValue(user.permissions) ? user.permissions : user.Permissions;
  if (hasValue(permissions)) {
    attributeSetsEmailDemographics.items[0].values.push({ "name": "Permissions", "value": permissions });
  }

  var postnummer = hasValue(user.postnummer) ? user.postnummer : user.ZipCode;
  if (hasValueAndNoEmptyString(postnummer)) {
    postnummer = postnummer.trim();
    var isDanishZipCode = new RegExp('^[0-9]{1,4}$').test(postnummer);
    if(isDanishZipCode) {
      attributeSetsEmailDemographics.items[0].values.push({ "name": "ZipCode", "value": postnummer });
    } else {
      attributeSetsEmailDemographics.items[0].values.push({ "name": "ZipCodeOther", "value": postnummer });
    }
  }

  var robinson_flag = hasValue(user.robinson_flag) ? user.robinson_flag : user.Robinson;
  if (hasValue(robinson_flag)) {
    attributeSetsEmailDemographics.items[0].values.push({ "name": "Robinson", "value": robinson_flag });
  }

  var foedselsaar = hasValue(user.foedselsaar) ? user.foedselsaar : user.Birthyear;
  if (hasValueAndNoEmptyString(foedselsaar)) {
    attributeSetsEmailDemographics.items[0].values.push({ "name": "Birthyear", "value": foedselsaar });
  }

  var koen = hasValue(user.koen) ? user.koen : user.Sex;
  if (hasValue(koen)) {
    attributeSetsEmailDemographics.items[0].values.push({ "name": "Sex", "value": koen });
  }

  var ekstern_id = hasValue(user.ekstern_id) ? user.ekstern_id : user.ExternalId;
  if (hasValue(ekstern_id)) {
    attributeSetsEmailDemographics.items[0].values.push({ "name": "ExternalId", "value": ekstern_id });
  }

  var attributeSets = [];

  if (attributeSetsEmailAddresses.items[0].values.length > 0) {
    attributeSets.push(attributeSetsEmailAddresses);
  }

  if (attributeSetsEmailDemographics.items[0].values.length > 0) {
    attributeSets.push(attributeSetsEmailDemographics);
  }

  return attributeSets;
}


function hasValueAndNoEmptyString(input){
  return hasValue(input) && input !== '';
}

function hasValue(input){
  return input !== undefined && input !== null;
}


function itemsValueCallback (callback) {
  return function (err, data) {
    if (err) {
      if (callback !== undefined && typeof callback === 'function') {
        callback(err);
      } else {
        console.log(Date().toString(), err);
      }
    } else if (callback !== undefined && typeof callback === 'function') {
      if (data.count && data.count === 1){
        callback(null, flattenItem(data.items[0]));
      } else if (data.items) {
        data.items = data.items.map(flattenItem);
        callback(null, data);
      } else {
        callback(null, data);
      }
    } else {
      console.log(Date().toString(), data.items.map(flattenItem));
    }
  };
}


function flattenItem(item){
  if (!item.values){
    return item;
  }
  var t = {};
  item.values.forEach(function(value, index){
    if(value.value) {
      t[value.name] = value.value;
    }
  });
  return t;
}


function standardCallback (callback) {
  return function (err, data) {
    if (err) {
      if (callback !== undefined && typeof callback === 'function') {
        callback(err);
      } else {
        console.error(Date().toString(), err);
      }
    } else if (callback !== undefined && typeof callback === 'function') {
      callback(null, data);
    }
  };
}


function callExactTarget (method, path, body, callback) {
  if (callback === undefined && typeof body === 'function') {
    callback = body;
    body = null;
  } else if(callback === undefined){
    callback = function(err, response){
      console.log(Date().toString(), 'Reponse on request to ' + path, err !== null ? err : response);
    };
  }

  if (authResponse === {}){
    return callback(new Error('ExactTarget client not initialized'));
  }

  var options = {
    hostname: 'www.exacttargetapis.com',
    port: 443,
    path: path,
    method: method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '.concat(authResponse.accessToken)
    }
  };

  var req = https.request(options, parseReponse(df));

  if (body !== null){
    if (typeof body === 'object') {
      body = JSON.stringify(body)
    }
    req.write(body);
  }
  req.end();

  req.on('error', function (e) {
    if (callback !== undefined && typeof callback === 'function'){
      callback(e);
    } else {
      console.log(Date().toString(), 'Error on request to ' + path, e);
    }
  });

  function df(err, response){
    if(err && err.statusCode === 401){
      getExactTargetAuthtoken(function(){
        callExactTarget(method, path, body, callback);
      });
    } else {
      callback(err, response);
    }
  }
}


function getExactTargetAuthtoken (callback) {
  if (callback === undefined || typeof callback !== 'function'){
    callback = function(){};
  }

  var options = {
    hostname: 'auth.exacttargetapis.com',
    port: 443,
    path: '/v1/requestToken',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  var req = https.request(options, parseReponse(function(err, response){
    if (err){
      callback(err);
    } else {
      authResponse = response;
      console.log('ExactTarget authResponse', authResponse);
      callback(authResponse);
    }
  }));

  var body = {
    "clientId": clientId,
    "clientSecret": clientSecret
  };

  req.write(JSON.stringify(body));
  req.end();

  req.on('error', function (e) {
    console.log(Date().toString(), 'Error on request to ' + options.path, e);
    callback(e);
  });
}


function parseReponse (callback) {
  if (callback === undefined || typeof callback !== 'function'){
    callback = function(){};
  }

  return function(res) {
    var data = '';

    res.on('data', function(d) {
      data = data + d;
    });

    res.on('end', function() {

      if (data === ''){
        data = '{}';
      }

      try {
        data = JSON.parse(data);
      } catch (ex) {
        console.error('JSON parse error on: ', data);
        // throw ex;
        return callback(ex);
      }

      if (data.errorcode || res.statusCode > 300) {
        data.statusCode = res.statusCode;
        callback(data, null);
      } else {
        callback(null, data);
      }
    });
  };
}
