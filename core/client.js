define(['socket.io-client/socket.io', 'core/web'], function(socket_io, web_) {
  
  var socket = socket_io();
  
  socket.on('connect', function() {
    console.log('socket connected');
  });
  socket.on('disconnect', function() {
    console.log('socket disconnected');
  });
  
  socket.on('reconnect', function() {
    console.log('socket reconnecting..');
  });
  socket.on('reconnect', function() {
    console.log('socket reconnected');
  });
  socket.on('reconnect_failed', function() {
    console.log('reconnect failed');
  });
  
  var web = web_();
  
  socket.on('addNames', function(names) {
    web.addNames(names);
  });
  
  socket.on('removeNames', function(nodes) {
    web.removeNames(nodes);
  });
  
  socket.on('setLinks', function(add, remove) {
    web.setLinks(add, remove);
  });
  
  var onSeedCallbacks = new Set();
  var isSeeded = false;
  socket.on('seedLinks', function(links) {
    web.setLinks(links, []);
    isSeeded = true;
    onSeedCallbacks.forEach(function(callback) {
      callback();
    });
  });
  
  return {
    socket: socket,
    web: web,
    addNames: function(names) {
      web.addNames(names);
      socket.emit('addNames', names);
    },
    removeNames: function(nodes) {
      web.removeNames(nodes);
      socket.emit('removeNames', nodes);
    },
    setLinks: function(add, remove) {
      web.setLinks(add, remove);
      socket.emit('setLinks', Array.from(add), Array.from(remove));
    },
    query: function(from, via, to) {
      return web.query(from, via, to);
    },
    queryOne: function(from, via, to) {
      return web.queryOne(from, via, to);
    },
    onSeed: function(callback) {
      onSeedCallbacks.add(callback);
    },
    isSeeded: function() {
      return isSeeded;
    },
  }
});
