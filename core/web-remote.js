// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./web'], function(Web) {
  
  function Client(socketio) {
    var self = this;
    
    self._socketio = socketio;
    self._web = Web();
    
    self._isSeeded = false;
    self._onSeed = new Set();
    
    socketio.on('seedLinks', function(links) {
      self._web.setLinks(links, []);
      self._isSeeded = true;
      self._onSeed.forEach(function(callback) {
        callback();
      });
      self._onSeed.clear();
    });
    
    socketio.on('addNames', function(names) {
      self._web.addNames(names);
    });
    
    socketio.on('removeNames', function(nodes) {
      self._web.removeNames(nodes);
    });
    
    socketio.on('setLinks', function(params) {
      self._web.setLinks(params.add, params.remove);
    });
  }
  
  
  // Names
  
  Client.prototype.addNames = function(names) {
    this._web.addNames(names);
    this._socketio.emit('addNames', names);
  }
  
  Client.prototype.removeNames = function(nodes) {
    this._web.removeNames(nodes);
    this._socketio.emit('removeNames', nodes);
  }
  
  Client.prototype.getNames = function() {
    return this._web.getNames();
  }
  
  Client.prototype.hasName = function(node) {
    return this._web.hasName(node);
  }
  
  Client.prototype.getName = function(node) {
    return this._web.getName(node);
  }
  
  Client.prototype.onNames = function(callback) {
    this._web.onNames(callback);
  }
  
  
  // Links
  
  Client.prototype.setLinks = function(add, remove) {
    this._web.setLinks(add, remove);
    var params = {
      add:    Array.from(add), 
      remove: Array.from(remove),
    }
    this._socketio.emit('setLinks', params);
  }
  
  Client.prototype.onLinks = function(callback) {
    this._web.onLinks(callback);
  }
  
  Client.prototype.getLinks = function() {
    return this._web.getLinks();
  }
  
  
  // Query
  
  Client.prototype.query = function(from, via, to) {
    return this._web.query(from, via, to);
  }
  
  Client.prototype.queryOne = function(from, via, to) {
    return this._web.queryOne(from, via, to);
  }
  
  Client.prototype.isSeeded = function() {
    return this._isSeeded;
  }
  
  Client.prototype.onSeed = function(callback) {
    this._onSeed.add(callback);
  }
  
  
  function Server(socketio, web) {
    var self = this;
    
    self._socketio = socketio;
    self._web    = web;
    
    socketio.on('connection', function(connection) {
      
      // Seed client
      self._web.getNames(function(names) {
        connection.emit('addNames', names);
      });
      self._web.getLinks(function(links) {
        connection.emit('seedLinks', links);
      });
      
      // Links
      connection.on('setLinks', function(params) {
        self._web.setLinks(params.add, params.remove);
        connection.broadcast.emit('setLinks', params);
      });
      
      // Names
      connection.on('addNames', function(names) {
        self._web.addNames(names);
        connection.broadcast.emit('addNames', names);
      });
      connection.on('removeNames', function(nodes) {
        self._web.removeNames(nodes);
        socketconnection.broadcast.emit('removeNames', nodes);
      });
    });
  }
  
  
  return {
    Client: function(socketio) {
      return new Client(socketio);
    },
    Server: function(socketio, web) {
      return new Server(socketio, web);
    },
  }
});