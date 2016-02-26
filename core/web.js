// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./node_id', './node-multimap'], function(node_id, NodeMultimap) {
  
  function Web() {
    this.names = new Map();
    this.links = new Set();
    
    this.fromVia = NodeMultimap();
    this.viaTo   = NodeMultimap();
    this.fromTo  = NodeMultimap();
    
    this._onNames = new Set();
    this._onLinks = new Set();
  }
  
  Web.prototype.getNodes = function() {
    return Array.from(this.names.keys(), function(entry) {
      return node_id.fromMapKey(entry);
    });
  }
  
  
  // Names
  
  Web.prototype.getNames = function() {
    return Array.from(this.names.entries(), function(entry) {
      return {id: node_id.fromMapKey(entry[0]), name: entry[1]};
    });
  }
  
  Web.prototype.addNames = function(names) {
    var self = this;
    names.forEach(function(node) {
      self.names.set(node_id.toMapKey(node.id), node.name);
    });
    this._notifyNames(names, []);
  }
  
  Web.prototype.removeNames = function(nodes) {
    var self = this;
    nodes.forEach(function(nodeId) {
      self.names.delete(node_id.toMapKey(nodeId));
    });
    this._notifyNames([], nodes);
  }
  
  Web.prototype.hasName = function(id) {
    return this.names.has(node_id.toMapKey(id));
  }
  
  Web.prototype.getName = function(nodeId) {
    var mapKey = node_id.toMapKey(nodeId);
    if (!this.names.has(mapKey)) {
      return "";
    } else {
      return this.names.get(mapKey);
    }
  }
  
  Web.prototype.onNames = function(callback) {
    this._onNames.add(callback);
  }
  
  
  // Links
  
  Web.prototype.setLinks = function(add, remove) {
    var self = this;
    var addedLinks   = [];
    var removedLinks = [];
    add.forEach(function(link) {
      var linkKey = node_id.linkToKey(link);
      if (!self.links.has(linkKey)) {
        self.links.add(linkKey);
        self.fromVia.add([link.from, link.via], link.to);
        self.viaTo.add(  [link.via,  link.to],  link.from);
        self.fromTo.add( [link.from, link.to],  link.via);
        addedLinks.push(link);
      }
    });
    remove.forEach(function(link) {
      var linkKey = node_id.linkToKey(link);
      if (self.links.has(linkKey)) {
        self.links.delete(linkKey);
        self.fromVia.delete([link.from, link.via], link.to);
        self.viaTo.delete(  [link.via,  link.to],  link.from);
        self.fromTo.delete( [link.from, link.to],  link.via);
        removedLinks.push(link);
      }
    });
    if (addedLinks.length > 0 || removedLinks.length > 0) {
      self._notifyLinks(addedLinks, removedLinks);
    }
  }
  
  Web.prototype.hasLink = function(from, via, to) {
    return this.links.has(node_id.toHex(from) +
                          node_id.toHex(via) +
                          node_id.toHex(to));
  }
  
  Web.prototype.getLinks = function() {
    return Array.from(this.links.values(), function(key) {
      return node_id.linkFromKey(key);
    });
  }
  
  Web.prototype.clear = function() {
    this.links.clear();
    this.fromVia.clear();
    this.viaTo.clear();
    this.fromTo.clear();
  }
  
  
  // Events
  
  Web.prototype.onLinks = function(callback) {
    this._onLinks.add(callback);
  }
  
  Web.prototype.removeLinksListener = function(callback) {
    this._onLinks.delete(callback);
  }
  
  
  // Query
  
  Web.prototype.query = function(from, via, to) {
    if (from && via && !to) {
      return this.fromVia.get([from, via]);
    }
    if (via && to && !from) {
      return this.viaTo.get([via, to]);
    }
    if (from && to && !via) {
      return this.fromTo.get([from, to]);
    }
    throw 'Invalid query for web.';
  }
  
  Web.prototype.queryOne = function(from, via, to) {
    var result = this.query(from, via, to);
    if (result && result.size() === 1) {
      return result.getOne();
    } else {
      return null;
    }
  }
  
  
  // Private
  
  Web.prototype._notifyNames = function(namesAdded, namesRemoved) {
    var callbacks = new Set(this._onNames);
    callbacks.forEach(function(callback) {
      callback(namesAdded, namesRemoved);
    });
  }
  
  Web.prototype._notifyLinks = function(linksAdded, linksRemoved) {
    var callbacks = Array.from(this._onLinks);
    callbacks.forEach(function(callback) {
      callback(linksAdded, linksRemoved);
    });
  }
  
  return function() {
    return new Web();
  }
});
