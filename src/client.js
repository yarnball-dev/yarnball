define(['socket.io-client/socket.io', 'web'], function(socket_io, web_) {
  
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
  
  socket.on('setNodeNames', function(nodes) {
    web.setNodeNames(nodes);
  });
  
  socket.on('setNodeName', function(node) {
    web.setNodeName(node.id, node.name);
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
    setNodeName: function(id, name) {
      if (web.getNodeName(id) !== name) {
        web.setNodeName(id, name);
        socket.emit('setNodeName', {id: id, name: name});
      }
    },
    hasNodeName: function(id) {
      return web.hasNodeName(id);
    },
    getNodeName: function(id) {
      return web.getNodeName(id);
    },
    addLinks: function(links) {
      web.addLinks(links);
      socket.emit('addLinks', Array.from(links));
    },
    removeLinks: function(links) {
      web.removeLinks(links);
      socket.emit('removeLinks', Array.from(links));
    },
    onLinks: function(callback) {
      web.onLinks(callback);
    },
    removeLinksListener: function(callback) {
      web.removeLinksListener(callback);
    },
  }
});
