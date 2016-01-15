var express  = require('express');
var http     = require('http');
var socketio = require('socket.io');
var fs       = require('fs');
var readline = require('readline');

var app = express();
var server = http.Server(app);
var io = socketio(server);

var node_id = require('./node_id');
var web_    = require('./web');


app.use(express.static('.'));

var web = web_();

var nodeNamesStream = fs.createReadStream('node_names.txt');
var nodeNamesReader = readline.createInterface({
  input: nodeNamesStream,
  output: process.stdout,
  terminal: false
});

nodeNamesReader.on('line', function(line) {
  var hexString = line.slice(0, 32);
  var name = line.slice(33);
  web.setNodeName(node_id.fromHex(hexString), name);
});

var linksStream = fs.createReadStream('links.txt');
var linksReader = readline.createInterface({
  input: linksStream,
  output: process.stdout,
  terminal: false
});

linksReader.on('line', function(line) {
  var fromString = line.slice(0, 32);
  var viaString  = line.slice(32 + 1, 32 + 1 + 32);
  var toString   = line.slice(32 + 1 + 32 + 1, 32 + 1 + 32 + 1 + 32);
  web.setLink({
    from: node_id.fromHex(fromString),
    via:  node_id.fromHex(viaString),
    to:   node_id.fromHex(toString),
  });
});

io.on('connection', function(socket) {
  console.log('socket connected');
  
  socket.on('disconnect', function() {
    console.log('socket disconnected');
  });
  
  socket.emit('setNodeNames', web.getNodeNames());
  socket.emit('setLinks',     web.getLinks());
  
  socket.on('setNodeName', function(node) {
    console.log('Setting ' + node_id.toHex(node.id) + ' name to "' + node.name + '"');
    if (web.getNodeName(node.id) !== node.name) {
      web.setNodeName(node.id, node.name);
      socket.broadcast.emit('setNodeName', node);
    }
  });
  
  socket.on('setLink', function(link) {
    web.setLink(link);
    socket.broadcast.emit('setLink', link);
  });
  
  socket.on('unsetLink', function(link) {
    web.unsetLink(link);
    socket.broadcast.emit('unsetLink', link);
  });
});

server.listen(3000, function() {
  console.log('listening on port 3000');
});