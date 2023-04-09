const crypto = require('crypto');
const url = require('url');
const request = require('request');
const urlencode = require('urlencode');

exports.printMsg = function() {
  console.log("This is a test message from the verbandonline-node-api package");
}

exports.setVerbandsUrl = function(_verbandsUrl){
  verbandsUrl = _verbandsUrl;
}

exports.setToken = function(usr, pwd){
  token = generate_token(usr, pwd);
}

exports.request = function(methodenname, parameter){
  if(verbandsUrl == null){
    throw new Error("verbandsURL not set, use setVerbandsUrl(verbandsUrl) first");
  }
  if(token == null){
    throw new Error("token not set, use setToken(username, password) first");
  }
  return request(verbandsUrl, token, methodenname, parameter);
}

const verbandsUrl = null;
const token = null;

function generate_token(usr, pwd){
  return urlencode("A/" + usr + "/" + crypto.createHash('md5').update(pwd).digest('hex'));
}

function parameter_to_string(parameter){
  var string = ""
  for(const [key, value] of Object.entries(parameter)){
    string += "&" + urlencode(key) + "=" + urlencode(value);
  }
  return string;
}

function request(verbandurl, token, methodenname, parameter){
  if(!url.endsWith("/")){
    url += "/";
  }

  const url = new URL(verbandurl + "?api=" + urlencode(methodenname) + "&token=" + token + parameter_to_string(parameter));
  return request.get(url, { json: true});
}
