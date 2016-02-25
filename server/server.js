var express  = require('express');
var http     = require('http');
var socketio = require('socket.io');
var yargs    = require('yargs');

var app = express();
var server = http.Server(app);
var io = socketio(server);

var node_id  = require('./core/node_id');
var web_db   = require('./core/web_db');
var web_file = require('./core/web_file');


if (yargs.argv['serve-static']) {
  app.use(express.static('../site'));
}

var webDb = web_db('./db');
var webFile = web_file('node_names.txt', 'links.txt');

webDb.merge(webFile, function() {
  console.log('merge complete');
});

io.on('connection', function(socket) {
  console.log('socket connected');
  
  socket.on('disconnect', function() {
    console.log('socket disconnected');
  });
  
  webDb.getNames(function(names) {
    socket.emit('addNames', names);
  });
  webDb.getLinks(function(links) {
    socket.emit('seedLinks', links);
  });
  
  socket.on('addNames', function(names) {
    names.forEach(function(node) {
      console.log('Setting ' + node_id.toHex(node.id) + ' name to "' + node.name + '"');
    });
    socket.broadcast.emit('addNames', names);
    webDb.addNames(names);
  });
  
  socket.on('removeNames', function(nodes) {
    nodes.forEach(function(nodeId) {
      console.log('Removing name for ' + node_id.toHex(nodeId));
    });
    socket.broadcast.emit('removeNames', nodes);
    webDb.removeNames(nodes);
  });
  
  socket.on('setLinks', function(add, remove) {
    webDb.setLinks(add, remove);
    socket.broadcast.emit('setLinks', add, remove);
  });
});

server.listen(3000, function() {
  console.log('listening on port 3000');
});