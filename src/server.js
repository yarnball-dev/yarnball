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
var lineReader = readline.createInterface({
  input: nodeNamesStream,
  output: process.stdout,
  terminal: false
});

lineReader.on('line', function(line) {
  var hexString = line.slice(0, 32);
  var name = line.slice(33);
  web.setNodeName(node_id.fromHex(hexString), name);
});

io.on('connection', function(socket) {
  console.log('socket connected');
  
  socket.on('disconnect', function() {
    console.log('socket disconnected');
  });
  
  socket.emit('setNodeNames', web.getNodeNames());
  
  socket.on('setNodeName', function(node) {
    console.log('Setting ' + node_id.toHex(node.id) + ' name to "' + node.name + '"');
    web.setNodeName(node.id, node.name);
    socket.broadcast.emit('setNodeName', node);
  });
});

server.listen(3000, function() {
  console.log('listening on port 3000');
});