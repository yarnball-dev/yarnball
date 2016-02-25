// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./node_id'], function(node_id) {
  
  function List(web, next, value, base) {
    this._web   = web;
    this._next  = next;
    this._value = value;
    this._base  = base || null;
  }
  
  List.prototype.getKeys = function() {
    var keys = [];
    
    if (this._base) {
      keys.push(this._base);
      
      var keysAlreadySeen = new Set([node_id.toMapKey(this._base)]);
    
      var currentKey = this._base;
      while (true) {
        var nextKey = this.nextKey(currentKey);
        if (!nextKey || keysAlreadySeen.has(node_id.toMapKey(nextKey))) {
          break;
        }
        currentKey = nextKey;
        keysAlreadySeen.add(node_id.toMapKey(currentKey));
        keys.push(currentKey);
      }
    }
    
    return keys;
  }
  
  List.prototype.get = function() {
    var self = this;
    return this.getKeys().map(function(key) {
      return self.value(key);
    });
  }
  
  List.prototype.value = function(key) {
    return this._web.queryOne(key, this._value, null);
  }
  
  List.prototype.nextKey = function(key) {
    return this._web.queryOne(key, this._next, null);
  }
  
  List.prototype.previousKey = function(key) {
    return this._web.queryOne(null, this._next, key);
  }
  
  List.prototype.lastKey = function() {
    if (!this._base) {
      return null;
    }
    var currentNode = this._base;
    var nodesSet = new Set([node_id.toMapKey(this._base)]);
    while (true) {
      var nextNode = this.nextKey(currentNode);
      if (!nextNode || nodesSet.has(node_id.toMapKey(nextNode))) {
        return currentNode;
      }
      currentNode = nextNode;
    }
  }
  
  List.prototype.append = function(values) {
    var self = this;
    values = Array.from(values);
    if (values.length > 0) {
      var newLinks = [];
      var previousKey = self.lastKey();
      values.forEach(function(value) {
        var key = node_id.make();
        if (!self._base) {
          self._base = key;
        }
        newLinks.push({
          from: key,
          via: self._value,
          to: value,
        });
        if (previousKey) {
          newLinks.push({
            from: previousKey,
            via: self._next,
            to: key,
          });
        }
        previousKey = key;
      });
      if (newLinks.length > 0) {
        self._web.setLinks(newLinks, []);
      }
    }
    return self._base;
  }
  
  List.prototype.deleteKeys = function(keys) {
    var self = this;
    
    if (!self._base) {
      return;
    }
    
    keys = new Set(Array.from(keys).map(function(key) {
      return node_id.toMapKey(key);
    }));
    
    if (keys.size > 0) {
      
      var linksAdded   = [];
      var linksRemoved = [];
    
      var currentKey = self._base;
      var keysAlreadySeen = new Set();
      var previousKey = null;
      var lastNonDeletedKey = null;
      while (currentKey) {
        var deletingCurrentNode = keys.has(node_id.toMapKey(currentKey));
        if (deletingCurrentNode) {
          linksRemoved.push({
            from: currentKey,
            via: self._value,
            to: this.value(currentKey),
          });
        }
        if (previousKey && deletingCurrentNode) {
          linksRemoved.push({
            from: previousNode,
            via: self._next,
            to: currentKey,
          });
        }
        if (!deletingCurrentNode) {
          if (previousNode && keys.has(node_id.toMapKey(previousKey))) {
            linksRemoved.push({
              from: previousKey,
              via: self._next,
              to: currentKey,
            });
          }
          if (lastNonDeletedKey) {
            linksAdded.push({
              from: lastNonDeletedKey,
              via: self._next,
              to: currentKey,
            });
          } else {
            self._base = currentKey;
          }
          lastNonDeletedKey = currentKey;
        }
        var nextKey = self.nextKey(currentKey);
        keysAlreadySeen.add(node_id.toMapKey(currentKey));
        if (!nextKey || keysAlreadySeen.has(node_id.toMapKey(nextKey))) {
          break;
        }
        previousKey = currentKey;
        currentKey = nextKey;
      }
      if (!lastNonDeletedKey) {
        self._base = null;
      }
      
      if (linksAdded.length > 0 || linksRemoved.length > 0) {
        self._web.setLinks(linksAdded, linksRemoved);
      }
    }
  }
  
  List.prototype.clear = function() {
    var self = this;
    var linksRemoved = [];
    var keys = self.getKeys();
    var previousKey = null;
    keys.forEach(function(key) {
      var value = self.value(key);
      if (value) {
        linksRemoved.push({
          from: key,
          via: self._value,
          to: value,
        });
      }
      if (previousKey) {
        linksRemoved.push({
          from: previousKey,
          via: self._next,
          to: key,
        });
      }
    });
    self._base = null;
    if (linksRemoved.length > 0) {
      self._web.setLinks([], linksRemoved);
    }
  }
  
  return function(web, next, value, base) {
    return new List(web, next, value, base);
  }
});