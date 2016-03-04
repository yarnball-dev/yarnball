var Users        = require('./users');
var Web_SocketIO = require('core/web-socketio');
var SocketioJwt  = require("socketio-jwt");
var UnauthorizedError = require("socketio-jwt/lib/UnauthorizedError");

function Users_SocketIO(users, socketio) {
  var self = this;
  
  self._users    = users;
  self._socketio = socketio;
  self._userNamespaces = new Map();
  socketio.on('connection', this._onConnection.bind(this));
}

Users_SocketIO.prototype.setup = function() {
  var self = this;
  return self._users.getUsernames().then(function(usernames) {
    return Promise.all(usernames.map(function(username) {
      return self._createUserNamespace(username);
    })).then(function(users) {
      users.forEach(function(user) {
        self._userNamespaces.set(user.username, user.namespace);
      });
      return usernames;
    });
  });
}

Users_SocketIO.prototype._onConnection = function(connection) {
  var self = this;
  
  connection.on('hasUser', function(username) {
    self._users.hasUser(username).then(function(hasUser) {
      connection.emit('hasUser_result', username, hasUser);
    });
  });
  
  connection.on('createUser', function(params, callback) {
    self._users.createUser(params.username, params.passwordHash).then(function() {
        self._createUserNamespace(params.username).then(function(userNamespace) {
          var token = self._users.createUserToken(params.username);
          callback(token);
        });
      },
      function(err) {
        connection.emit('createUser_result', {error: err});
      }
    );
  });
  
  connection.on('login', function(params, callback) {
    self._users.getUser(params.username).then(
      function(user) {
        if (params.passwordHash === user.passwordHash) {
          var token = self._users.createUserToken(user.username);
          callback(token);
        } else {
          callback({error: 'Invalid username/password.'});
        }
      },
      function(error) {
        callback({error: 'Invalid username/password.'});
      }
    );
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

module.exports = function(users, socketio) {
  return new Users_SocketIO(users, socketio);
}