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
  
  socket.on('setLinks', function(links) {
    web.setLinks(links);
  });
  
  socket.on('setLink', function(link) {
    web.setLink(link);
  });
  
  socket.on('unsetLink', function(link) {
    web.unsetLink(link);
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
    setLink: function(link) {
      web.setLink(link);
      socket.emit('setLink', link);
    },
    setLinks: function(links) {
      web.setLinks(links);
    },
    unsetLink: function(link) {
      web.unsetLink(link);
      socket.emit('unsetLink', link);
    },
  }
});
