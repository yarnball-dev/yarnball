var express  = require('express');
var http     = require('http');
var socketio = require('socket.io');
var yargs    = require('yargs');

var app = express();
var server = http.Server(app);
var io = socketio(server);

var web_db    = require('./core/web_db');
var web_file  = require('./core/web_file');
var WebRemote = require('./core/web-remote');

if (yargs.argv['serve-static']) {
  app.use(express.static('../site'));
}

var webDb = web_db('./db');
var webFile = web_file('node_names.txt', 'links.txt');

webDb.merge(webFile, function() {
  console.log('merge complete');
});

var webRemoteServer = WebRemote.Server(io, webDb);

server.listen(3000, function() {
  console.log('listening on port 3000');
});