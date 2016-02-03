// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./node_id', 'level'], function(node_id, level) {
  
  function WebDb(databasePath) {
    this.db = level(databasePath);
  }
  
  WebDb.prototype.merge = function(web, callback) {
    var self = this;
    web.getNames(function(names) {
      self.addNames(names, callback);
    });
    web.getLinks(function(links) {
      self.addLinks(links);
    });
  }
  
  
  // Names
  
  WebDb.prototype.addNames = function(names, callback) {
    var ops = names.map(function(node) {
      return {
        type: 'put',
        key: 'name:' + node_id.toHex(node.id),
        value: node.name,
      }
    });
    this.db.batch(ops, function(err) {
      if (err) return console.log(err);
      if (callback) {
        callback();
      }
    });
  }
  
  WebDb.prototype.removeNames = function(nodes, callback) {
    var ops = nodes.map(function(nodeId) {
      return {
        type: 'del',
        key: 'name:' + node_id.toHex(nodeId),
      }
    });
    this.db.batch(ops, function(err) {
      if (err) return console.log(err);
      if (callback) {
        callback();
      }
    });
  }
  
  WebDb.prototype.getNames = function(callback) {
    var names = [];
    this.db.createReadStream()
      .on('data', function(data) {
        if (data.key.startsWith('name:')) {
          names.push({
            id: node_id.fromHex(data.key.slice('name:'.length)),
            name: data.value,
          });
        }
      })
      .on('error', function(err) {
        console.log(err);
      })
      .on('close', function() {
        
      })
      .on('end', function() {
        callback(names);
      });
  }
  
  
  // Links
  
  WebDb.prototype.addLinks = function(links, callback) {
    var ops = links.map(function(link) {
      return {
        type: 'put',
        key: 'link:' + node_id.linkToKey(link),
        value: '1',
      }
    });
    this.db.batch(ops, function(err) {
      if (err) return console.log(err);
      if (callback) {
        callback();
      }
    });
  }
  
  WebDb.prototype.removeLinks = function(links, callback) {
    var ops = links.map(function(link) {
      return {
        type: 'del',
        key: 'link:' + node_id.linkToKey(link),
      }
    });
    this.db.batch(ops, function(err) {
      if (err) return console.log(err);
      if (callback) {
        callback();
      }
    });
  }
  
  WebDb.prototype.getLinks = function(callback) {
    var links = [];
    this.db.createReadStream()
      .on('data', function(data) {
        if (data.key.startsWith('link:')) {
          links.push(node_id.linkFromKey(data.key.slice('link:'.length)));
        }
      })
      .on('error', function(err) {
        console.log(err);
      })
      .on('close', function() {
        
      })
      .on('end', function() {
        callback(links);
      });
  }
  
  return function(databasePath) {
    return new WebDb(databasePath);
  }
  
});
