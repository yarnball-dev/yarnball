// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./node_id'], function(node_id) {
  
  function NodeMultimap() {
    this.map = new Map();
  }
  
  NodeMultimap.prototype.get = function(nodes) {
    var values = this.map.get(this._keyForNodes(nodes));
    if (values) {
      return Array.from(values).map(function(value) {
        return node_id.fromMapKey(value);
      });
    } else {
      return [];
    }
  }
  
  NodeMultimap.prototype.add = function(nodes, value) {
    var nodesKey = this._keyForNodes(nodes);
    var values = this.map.get(nodesKey);
    if (values) {
      values.add(node_id.toMapKey(value));
    } else {
      this.map.set(nodesKey, new Set([node_id.toMapKey(value)]));
    }
  }
  
  NodeMultimap.prototype.delete = function(nodes, value) {
    var nodesKey = this._keyForNodes(nodes);
    if (value) {
      var values = this.map.get(nodesKey);
      values.delete(node_id.toMapKey(value));
      if (values.size === 0) {
        this.map.delete(nodesKey);
      }
    } else {
      this.map.delete(nodesKey);
    }
  }
  
  NodeMultimap.prototype._keyForNodes = function(nodes) {
    return nodes.map(function(node) {
      return node_id.toMapKey(node);
    }).join('');
  }
  
  return function() {
    return new NodeMultimap();
  }
});