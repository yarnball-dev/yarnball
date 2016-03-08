var Level = require('level');
var exec  = require('child_process').exec;
var Path  = require('path');
var WebDB = require('core/web_db');
var jwt   = require('jsonwebtoken');

function Users(databasePath, userDataPath) {
  this._db = Level(databasePath);
  this._userDataPath = userDataPath;
  this._userWebs = new Map();
}

Users.isValidUsername = function(string) {
  return typeof string === 'string' && string.length > 0 && /^[a-zA-Z0-9-_]+$/.test(string);
}

Users.prototype.hasUser = function(username) {
  var self = this;
  
  if (!Users.isValidUsername(username)) {
    throw 'Cannot check if user exists, given parameter "' + username + '" is not a valid username.';
  }
  
  return new Promise(function(resolve, reject) {
    self._db.get(username, function(err, value) {
      if (err && err.type === 'NotFoundError') {
        resolve(false);
      } else if (!err) {
        resolve(true);
      } else if (err) {
        reject(err);
      }
    });
  });
}

Users.prototype.createUser = function(username, passwordHash) {
  var self = this;
  
  if (!Users.isValidUsername(username)) {
    throw 'Cannot create user, given parameter "' + username + '" is not a valid username.';
  }
  
  return new Promise(function(resolve, reject) {
    self._db.get(username, function(err, value) {
      if (value) {
        reject('Cannot create user "' + username + '", user already exists.');
      } else {
        self._db.put(username, passwordHash, function(err) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        });
      }
    });
  });
}

Users.prototype.getUser = function(username) {
  var self = this;
  
  if (!Users.isValidUsername(username)) {
    throw 'Cannot get user, given parameter "' + username + '" is not a valid username.';
  }
  
  return new Promise(function(resolve, reject) {
    self._db.get(username, function(err, value) {
      if (err) {
        reject(err);
      } else {
        resolve({username: username, passwordHash: value});
      }
    });
  });
}

// TODO: Read certificate from file
Users.tokenCertificate = '6914ecfd13cc057282142ee36e9f736a';

Users.prototype.createUserToken = function(username) {
  return jwt.sign({username: username}, Users.tokenCertificate);
}

Users.prototype.validateUserToken = function(username, token) {
  return new Promise(function(resolve, reject) {
    jwt.verify(token, Users.tokenCertificate, function(error, decodedToken) {
      if (error) {
        resolve(false);
      } else {
        resolve(decodedToken.username === username);
      }
    });
  });
}

Users.prototype.getUsernames = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    var usernames = [];
    self._db.createReadStream()
      .on('data', function(data) {
        if (!Users.isValidUsername(data.key)) {
          reject('Could not get usernames, a key returned from the database is not a valid username: ' + data.key);
        }
        usernames.push(data.key);
      })
      .on('end', function() {
        resolve(usernames);
      })
      .on('close', function() {
        resolve(usernames);
      })
      .on('error', function(err) {
        reject(err);
      });
  });
}

Users.prototype.getUserWeb = function(username) {
  var self = this;
  
  if (!Users.isValidUsername(username)) {
    throw 'Cannot get web for user, given parameter "' + username + '" is not a valid username.';
  }
  
  return new Promise(function(resolve, reject) {
    var userWeb = self._userWebs.get(username);
    if (userWeb) {
      resolve(userWeb);
    } else {
      var userDir = Path.join(self._userDataPath, username);
      exec('mkdir -p ' + userDir, function(err, stdout, stderr) {
        if (err) {
          reject('Could not get web for user "' + username + '", a directory could not be created at "' + userDir + '".');
        }
      }).on('exit', function() {
        var userWebDir = Path.join(userDir, 'db');
        var userWeb = WebDB(userWebDir);
        self._userWebs.set(username, userWeb);
        resolve(userWeb);
      });
    }
  });
}

Users.prototype.close = function(callback) {
  this._db.close(callback);
}

function Users_(databasePath, userDataPath) {
  return new Users(databasePath, userDataPath);
}
Users_.isValidUsername  = Users.isValidUsername;
Users_.tokenCertificate = Users.tokenCertificate;
module.exports = Users_;