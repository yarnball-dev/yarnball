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
    socket.emit('setNodeNames', names);
  });
  webDb.getLinks(function(links) {
    socket.emit('addLinks', links);
  });
  
  socket.on('setNodeName', function(node) {
    console.log('Setting ' + node_id.toHex(node.id) + ' name to "' + node.name + '"');
    socket.broadcast.emit('setNodeName', node);
    webDb.setNames([{id: node.id, name: node.name}]);
  });
  
  socket.on('addLinks', function(links) {
    console.log('adding links:');
    links.forEach(function(link) {
      console.log(node_id.toHex(link.from) + ' - ' + node_id.toHex(link.via) + ' - ' + node_id.toHex(link.to));
    });
    webDb.addLinks(links);
    socket.broadcast.emit('addLinks', links);
  });
  
  socket.on('removeLinks', function(links) {
    console.log('removing links:');
    links.forEach(function(link) {
      console.log(node_id.toHex(link.from) + ' - ' + node_id.toHex(link.via) + ' - ' + node_id.toHex(link.to));
    });
    webDb.removeLinks(links);
    socket.broadcast.emit('removeLinks', links);
  });
});

server.listen(3000, function() {
  console.log('listening on port 3000');
});