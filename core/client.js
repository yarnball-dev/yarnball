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
  
  socket.on('addLinks', function(links) {
    web.addLinks(links);
  });
  
  socket.on('removeLinks', function(links) {
    web.removeLinks(links);
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
    addLinks: function(links) {
      web.addLinks(links);
      socket.emit('addLinks', Array.from(links));
    },
    removeLinks: function(links) {
      web.removeLinks(links);
      socket.emit('removeLinks', Array.from(links));
    },
  }
});
