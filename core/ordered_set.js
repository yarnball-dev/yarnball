// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./node_id'], function(node_id) {
  
  function OrderedSet(web, next, base) {
    if (!next) {
      throw 'Cannot create set, "next" node not given.';
    }
    this._web  = web;
    this._next = next;
    this._base = base;
  }
  
  OrderedSet.prototype.get = function() {
    var nodes = [];
    
    if (this._base) {
      nodes.push(this._base);
      
      var nodesSet = new Set([node_id.toMapKey(this._base)]);
    
      var currentNode = this._base;
      while (true) {
        var nextNode = this.next(currentNode);
        if (!nextNode || nodesSet.has(node_id.toMapKey(nextNode))) {
          break;
        }
        currentNode = nextNode;
        nodes.push(currentNode);
      }
    }
    
    return nodes;
  }
  
  OrderedSet.prototype.next = function(node) {
    var result = this._web.query(node, this._next, null);
    if (result && result.size === 1) {
      return Array.from(result)[0]
    } else {
      return null;
    }
  }
  
  OrderedSet.prototype.previous = function(node) {
    var result = this._web.query(null, this._next, node);
    if (result && result.size === 1) {
      return Array.from(result)[0]
    } else {
      return null;
    }
  }
  
  OrderedSet.prototype.last = function() {
    if (!this._base) {
      return null;
    }
    var currentNode = this._base;
    var nodesSet = new Set([node_id.toMapKey(this._base)]);
    while (true) {
      var nextNode = this.next(currentNode);
      if (!nextNode || nodesSet.has(node_id.toMapKey(nextNode))) {
        return currentNode;
      }
      currentNode = nextNode;
    }
  }
  
  OrderedSet.prototype.append = function(nodes) {
    var self = this;
    nodes = Array.from(nodes);
    if (nodes.length > 0) {
      
      // Check for duplicates
      var nodesSet = new Set(nodes.map(function(node) {
        return node_id.toMapKey(node);
      }));
      if (nodesSet.size !== nodes.length) {
        throw 'Cannot append nodes to set, the given list of nodes contains duplicates.';
      }
        
      var newLinks = [];
      var previousNode = null;
      if (self._base) {
        var existingNodes = self.get();
        // Check if any nodes already exist in the set
        var existingNodesSet = new Set(self.get().map(function(existingNode) {
          return node_id.toMapKey(existingNode);
        }));
        if (nodes.some(function(node) { return existingNodesSet.has(node_id.toMapKey(node)) })) {
          throw 'Cannot append nodes to set, one or more nodes already exist in the set.';
        }
        previousNode = existingNodes[existingNodes.length - 1];
      } else {
        self._base = nodes[0];
      }
      nodes.forEach(function(node) {
        if (previousNode) {
          newLinks.push({
            from: previousNode,
            via: self._next,
            to: node,
          });
        }
        previousNode = node;
      });
      if (newLinks.length > 0) {
        self._web.addLinks(newLinks);
      }
    }
  }
  
  OrderedSet.prototype.delete = function(nodes) {
    var self = this;
    
    if (!self._base) {
      return;
    }
    
    nodes = new Set(Array.from(nodes).map(function(node) {
      return node_id.toMapKey(node);
    }));
    
    if (nodes.size > 0) {
      
      var linksAdded   = [];
      var linksRemoved = [];
    
      var currentNode = self._base;
      var nodesAlreadySeen = new Set();
      var previousNode = null;
      var lastNonDeletedNode = null;
      while (currentNode) {
        var deletingCurrentNode = nodes.has(node_id.toMapKey(currentNode));
        if (previousNode && deletingCurrentNode) {
          linksRemoved.push({
            from: previousNode,
            via: self._next,
            to: currentNode,
          });
        }
        if (!deletingCurrentNode) {
          if (previousNode && nodes.has(node_id.toMapKey(previousNode))) {
            linksRemoved.push({
              from: previousNode,
              via: self._next,
              to: currentNode,
            });
          }
          if (lastNonDeletedNode) {
            linksAdded.push({
              from: lastNonDeletedNode,
              via: self._next,
              to: currentNode,
            });
          } else {
            self._base = currentNode;
          }
          lastNonDeletedNode = currentNode;
        }
        var nextNode = self.next(currentNode);
        nodesAlreadySeen.add(node_id.toMapKey(currentNode));
        if (!nextNode || nodesAlreadySeen.has(node_id.toMapKey(nextNode))) {
          break;
        }
        previousNode = currentNode;
        currentNode = nextNode;
      }
      if (!lastNonDeletedNode) {
        self._base = null;
      }
      
      if (linksAdded.length > 0 || linksRemoved.length > 0) {
        self._web.setLinks(linksAdded, linksRemoved);
      }
    }
  }

  return function(web, base, next) {
    return new OrderedSet(web, base, next);
  }
});
