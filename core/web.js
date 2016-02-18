// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./node_id'], function(node_id) {
  
  function Web() {
    this.names = new Map();
    this.links = new Set();
    
    this._onNames = new Set();
    this._onLinks     = new Set();
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
  
  Web.prototype.addLinks = function(links) {
    var self = this;
    var newLinks = [];
    links.forEach(function(link) {
      var linkKey = node_id.linkToKey(link);
      if (!self.links.has(linkKey)) {
        self.links.add(linkKey);
        newLinks.push(link);
      }
    });
    if (newLinks.length > 0) {
      self._notifyLinks(newLinks, []);
    }
  }
  
  Web.prototype.removeLinks = function(links) {
    var self = this;
    var removedLinks = [];
    links.forEach(function(link) {
      var linkKey = node_id.linkToKey(link);
      if (self.links.has(linkKey)) {
        self.links.delete(linkKey);
        removedLinks.push(link);
      }
    });
    if (removedLinks.length > 0) {
      self._notifyLinks([], removedLinks);
    }
  }
  
  Web.prototype.setLinks = function(add, remove) {
    var self = this;
    var addedLinks   = [];
    var removedLinks = [];
    add.forEach(function(link) {
      var linkKey = node_id.linkToKey(link);
      if (!self.links.has(linkKey)) {
        self.links.add(linkKey);
        addedLinks.push(link);
      }
    });
    remove.forEach(function(link) {
      var linkKey = node_id.linkToKey(link);
      if (self.links.has(linkKey)) {
        self.links.delete(linkKey);
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
  
  Web.prototype.resetLinks = function(links) {
    var self = this;
    var linkKeys = new Set(links.map(function(link) {
      return node_id.linkToKey(link);
    }));
    var linksAdded   = [];
    var linksRemoved = [];
    linkKeys.forEach(function(linkKey) {
      if (!self.links.has(linkKey)) {
        linksAdded.push(node_id.linkFromKey(linkKey));
      }
    });
    self.links.forEach(function(linkKey) {
      if (!linkKeys.has(linkKey)) {
        linksRemoved.push(node_id.linkFromKey(linkKey));
      }
    });
    self.links = linkKeys;
    self._notifyLinks(linksAdded, linksRemoved);
  }
  
  Web.prototype.onLinks = function(callback) {
    this._onLinks.add(callback);
  }
  
  Web.prototype.removeLinksListener = function(callback) {
    this._onLinks.delete(callback);
  }
  
  
  // Query
  
  Web.prototype.query = function(from, via, to) {
    var result = new Set();
    if (((from ? 1:0) + (via ? 1:0) + (to ? 1:0)) === 2) {
      this.links.forEach(function(linkKey) {
        var link = node_id.linkFromKey(linkKey);
        if ((!from || node_id.equal(link.from, from)) &&
            (!via  || node_id.equal(link.via,  via))  &&
            (!to   || node_id.equal(link.to,   to))) {
          
          if (!from) result.add(link.from);
          if (!via)  result.add(link.via);
          if (!to)   result.add(link.to);
        }
      });
    }
    return result;
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
