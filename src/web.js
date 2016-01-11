if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['./node_id'], function(node_id) {
  
  function Web() {
    this.nodeNames = new Map();
    this.links = [];
    
    this._onNodeNames = new Set();
  }
  
  Web.prototype.getNodes = function() {
    return Array.from(this.nodeNames.keys(), function(entry) {
      return node_id.fromMapKey(entry);
    });
  }
  
  Web.prototype.getNodeNames = function() {
    return Array.from(this.nodeNames.entries(), function(entry) {
      return {id: node_id.fromMapKey(entry[0]), name: entry[1]};
    });
  }
  
  Web.prototype.setNodeNames = function(nodes) {
    var self = this;
    self.nodeNames.clear();
    nodes.forEach(function(node) {
      self.nodeNames.set(node_id.toMapKey(node.id), node.name);
    });
    this._notifyNodeNames();
  }
  
  Web.prototype.setNodeName = function(id, name) {
    this.nodeNames.set(node_id.toMapKey(id), name);
    this._notifyNodeNames([{id: id, name: name}]);
  }
  
  Web.prototype.hasNodeName = function(id) {
    return this.nodeNames.has(node_id.toMapKey(id));
  }
  
  Web.prototype.getNodeName = function(id) {
    if (!this.nodeNames.has(node_id.toMapKey(id))) {
      throw "Could not find name for " + node_id.toHex(id);
    }
    return this.nodeNames.get(node_id.toMapKey(id));
  }
  
  Web.prototype.addNewNode = function(name) {
    var id = node_id.make();
    this.nodeNames.set(node_id.toMapKey(id), name);
    var node = {id: id, name: name};
    this._notifyNodeNames([node]);
    return node;
  }
  
  Web.prototype.onNodeNames = function(callback) {
    this._onNodeNames.add(callback);
  }
  
  Web.prototype._notifyNodeNames = function(nodes) {
    if (typeof nodes === 'undefined') {
      nodes = this.getNodeNames();
    }
    var callbacks = new Set(this._onNodeNames);
    callbacks.forEach(function(callback) {
      callback(nodes);
    });
  }
  
  return function() {
    return new Web();
  }
});
