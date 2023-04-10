const crypto = require('crypto');
const url = require('url');
const request = require('request');
const urlencode = require('urlencode');
const winston = require('winston');

var logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({'timestamp': true}),
  ],
});

var verbandsUrl = null;
var token = null;

exports.printMsg = function() {
  console.log("This is a test message from the verbandonline-node-api package");
}

exports.setVerbandsUrl = function(_verbandsUrl){
  verbandsUrl = _verbandsUrl;
}

exports.setToken = function(usr, pwd){
  token = generate_token(usr, pwd);
}

exports.setLogger = function(_logger){
  logger = _logger;
}

exports.request = async function(methodenname, parameter, callback){
  if(verbandsUrl == null){
    throw new Error("verbandsURL not set, use setVerbandsUrl(verbandsUrl) first");
  }
  if(token == null){
    throw new Error("token not set, use setToken(username, password) first");
  }
  return await _request(verbandsUrl, token, methodenname, parameter, callback);
}

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

async function _request(verbandurl, token, methodenname, parameter, callback){
  if(!verbandurl.endsWith("/")){
    verbandurl += "/";
  }

  const url = new URL(verbandurl + "?api=" + urlencode(methodenname) + "&token=" + token + parameter_to_string(parameter));
  return await request.get(url, {json: true}, callback);
}

/**
 * Die Funktion sendet einen API-Request an Verbandonline und testet Nutzername und Passwort.
 * @param {string} usr 
 * @param {string} pwd 
 * @param {callback function(int)} res Diese Funktion wird mit der ID als Paramter aufgerufen, wenn der Login korrekt ist
 * @param {callback function(string)} err Diese Funktion wird bei einem internen Fehler (500) oder invaliden Login (403) mit einer Fehlermeldung aufgerufen
 */
exports.VerifyLoginID = function(usr, pwd, res, err){
  _request(verbandsUrl, token, 'VerifyLogin', {"user": usr, "password": pwd, "result": "id"}, (request_err, request_res, body) => {
    if(!request_err && body && body.hasOwnProperty("error")){
      logger.info("[403] fehlerhafter Login von " + usr + " -> " + body.error);
      err("[403] fehlerhafter Login von " + usr);
    } else if(!request_err && body){
        try {
            id = parseInt(body[0]);
            if(id != NaN && id >= 0){
                // successful login
                logger.info("[200] Erfolgreicher Login von " + usr);
                res(id);
            }
        } catch (error) {
            logger.error("[500] invalid response from Stammesmanager for user " + usr);
            logger.error(error);
            err("[500] interner Servererror");
        }
    } else {
        logger.error("[500] Error login of " + usr + " -> " + request_err);
        err("[500] interner Servererror");
    }
  });
}

exports.GetMember = function(id, res, err){
  _request(verbandsUrl, token, 'GetMember', {"id": id}, (request_err, request_res, body) => {
    if(!request_err && body && body.hasOwnProperty("error")){
      logger.error("[500] fehlerhafte Anfrage für ID " + id);
      logger.error(body.error);
      err("[500] fehlerhafte Anfrage für ID " + id);
    } else if(!request_err && body){
        try {
            if(body["id"] == id){
              // successful request
              logger.info("[200] Erfolgreicher Request für die ID " + id);
              res(body);
            }
        } catch (error) {
            logger.error("[500] invalid response from Stammesmanager for ID " + id);
            logger.error(error);
            err("[500] interner Servererror");
        }
    } else {
        logger.error("[500] Error für ID " + id);
        logger.error(request_err);
        err("[500] interner Servererror");
    }
  });
}