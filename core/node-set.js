// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./node_id'], function(node_id) {
  
  function NodeSet(nodes) {
    if (nodes) {
      this._set = new Set(Array.from(nodes).map(function(node) {
        return node_id.toMapKey(node);
      }));
    } else {
      this._set = new Set();
    }
  }
  
  NodeSet.prototype.add = function(node) {
    this._set.add(node_id.toMapKey(node));
  }
  
  NodeSet.prototype.addSet = function(set) {
    var self = this;
    set._set.forEach(function(key) {
      self._set.add(key);
    });
  }
  
  NodeSet.prototype.deleteSet = function(set) {
    var self = this;
    set._set.forEach(function(key) {
      self._set.delete(key);
    });
  }
  
  NodeSet.prototype.delete = function(node) {
    this._set.delete(node_id.toMapKey(node));
  }
  
  NodeSet.prototype.has = function(node) {
    return this._set.has(node_id.toMapKey(node));
  }
  
  NodeSet.prototype.getOne = function() {
    if (this._set.size === 1) {
      return node_id.fromMapKey(Array.from(this._set)[0]);
    } else {
      throw 'Cannot get node set as single node, set size is not 1.';
    }
  }
  
  NodeSet.prototype.clear = function() {
    this._set.clear();
  }
  
  NodeSet.prototype.size = function() {
    return this._set.size;
  }
  
  NodeSet.prototype.forEach = function(callback) {
    this._set.forEach(function(key) {
      callback(node_id.fromMapKey(key));
    });
  }
  
  NodeSet.prototype.map = function(callback) {
    return this._set.map(function(key) {
      return callback(node_id.fromMapKey(key));
    });
  }
  
  return function(nodes) {
    return new NodeSet(nodes);
  }
});