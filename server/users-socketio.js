var Users        = require('./users');
var Web_SocketIO = require('core/web-socketio');
var SocketioJwt  = require("socketio-jwt");
var UnauthorizedError = require("socketio-jwt/lib/UnauthorizedError");

function Users_SocketIO(users, socketio) {
  this._users    = users;
  this._socketio = socketio;
  this._userNamespaces = new Map();
  socketio.on('connection', this._onConnection.bind(this));
}

Users_SocketIO.prototype.setup = function() {
  var self = this;
  
  return self._users.getUsernames()
  
  .then(function(usernames) {
    return Promise.all(usernames.map(function(username) {
      return self._createUserNamespace(username);
    }));
  })
  
  .then(function(users) {
    users.forEach(function(user) {
      self._userNamespaces.set(user.username, user.namespace);
    });
  });
}

Users_SocketIO.prototype._onConnection = function(connection) {
  connection.on('hasUser',           this._hasUser.bind(this));
  connection.on('createUser',        this._createUser.bind(this));
  connection.on('login',             this._login.bind(this));
  connection.on('validateUserToken', this._validateUserToken.bind(this));
}

Users_SocketIO.prototype._hasUser = function(username, callback) {
  this._users.hasUser(username)
  
  .then(function(hasUser) {
    callback(hasUser);
  })
  
  .catch(function(error) {
    callback({error: error});
  });
}

Users_SocketIO.prototype._createUser = function(params, callback) {
  var self = this;
  
  self._users.createUser(params.username, params.passwordHash)
  
  .then(function() {
    return self._createUserNamespace(params.username);
  })
  
  .then(function(userNamespace) {
    var token = self._users.createUserToken(params.username);
    callback(token);
  })
  
  .catch(function(error) {
    callback({error: error});
  });
}

Users_SocketIO.prototype._login = function(params, callback) {
  var self = this;
  
  self._users.getUser(params.username)
  
  .then(function(user) {
    if (params.passwordHash !== user.passwordHash) {
      throw 'Invalid username/password.';
    }
    
    callback(self._users.createUserToken(user.username));
  })
  
  .catch(function(error) {
    callback({error: 'Invalid username/password.'});
  });
}

Users_SocketIO.prototype._createUserNamespace = function(username) {
  var self = this;
  
  if (!Users.isValidUsername(username)) {
    throw 'Cannot create user namespace, username is invalid: "' + username + '".';
  }
  
  return self._users.getUserWeb(username).then(function(userWeb) {
    var namespace = self._socketio.of('/' + username);
    
    namespace.use(SocketioJwt.authorize({
      secret: Users.tokenCertificate,
      handshake: true,
      success: function(data, accept) {
        if (data.decoded_token.username !== username) {
          console.log('Client authorized only for user "' + data.decoded_token.username + '" attempted to connect to user "' + username + '".');
          accept(new UnauthorizedError('not_authorized_for_user', {message: 'Not authorized for this user.'}));
        } else {
          accept();
        }
      },
    }));
    
    namespace.on('connection', function(connection) {
      console.log('Client connected to user namespace "' + username + '".');
      var webServer = Web_SocketIO.Server(connection, userWeb);
    });
    
    namespace.on('error', function(error) {
      console.log(error);
    });
    
    return {username: username, namespace: namespace};
  });
}

Users_SocketIO.prototype._validateUserToken = function(params, callback) {
  this._users.validateUserToken(params.username, params.token)
  
  .then(function(isValid) {
    callback(isValid);
  })
  
  .catch(function(error) {
    callback({error: error});
  });
}

module.exports = function(users, socketio) {
  return new Users_SocketIO(users, socketio);
}