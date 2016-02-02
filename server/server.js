var express  = require('express');
var http     = require('http');
var socketio = require('socket.io');
var fs       = require('fs');
var readline = require('readline');

var app = express();
var server = http.Server(app);
var io = socketio(server);

var node_id = require('./core/node_id');
var web_    = require('./core/web');


app.use(express.static('../site'));

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
  web.addLinks([{
    from: node_id.fromHex(fromString),
    via:  node_id.fromHex(viaString),
    to:   node_id.fromHex(toString),
  }]);
});

io.on('connection', function(socket) {
  console.log('socket connected');
  
  socket.on('disconnect', function() {
    console.log('socket disconnected');
  });
  
  socket.emit('setNodeNames', web.getNodeNames());
  socket.emit('addLinks',     web.getLinks());
  
  socket.on('setNodeName', function(node) {
    console.log('Setting ' + node_id.toHex(node.id) + ' name to "' + node.name + '"');
    if (web.getNodeName(node.id) !== node.name) {
      web.setNodeName(node.id, node.name);
      socket.broadcast.emit('setNodeName', node);
    }
  });
  
  socket.on('addLinks', function(links) {
    web.addLinks(links);
    socket.broadcast.emit('addLinks', links);
  });
  
  socket.on('removeLinks', function(links) {
    web.removeLinks(links);
    socket.broadcast.emit('removeLinks', links);
  });
});

server.listen(3000, function() {
  console.log('listening on port 3000');
});