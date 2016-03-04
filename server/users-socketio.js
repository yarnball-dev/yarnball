var Users       = require('./users');
var Web_SocketIO = require('core/web-socketio');

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
  connection.on('createUser', function(params) {
    self._users.createUser(params.username, params.passwordHash).then(function() {
        self._createUserNamespace(params.username).then(function(userNamespace) {
          connection.emit('createUser_result', {username: params.username, authToken: 42});
        });
      },
      function(err) {
        connection.emit('createUser_result', {error: err});
      }
    );
  });
  
  connection.on('hasUser', function(username) {
    self._users.hasUser(username).then(function(hasUser) {
      connection.emit('hasUser_result', username, hasUser);
    });
  });
}

Users_SocketIO.prototype._createUserNamespace = function(username) {
  var self = this;
  
  if (!Users.isValidUsername(username)) {
    throw 'Cannot create user namespace, username is invalid: "' + username + '".';
  }
  
  return self._users.getUserWeb(username).then(function(userWeb) {
    var namespace = self._socketio.of('/' + username);
    namespace.on('connection', function(connection) {
      // TODO: Get username from token
      var tokenUsername = username;
      
      if (tokenUsername !== username) {
        return;
      }
      
      var webServer = Web_SocketIO.Server(connection, userWeb);
    });
    return {username: username, namespace: namespace};
  });
}

module.exports = function(users, socketio) {
  return new Users_SocketIO(users, socketio);
}