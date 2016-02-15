// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./node_id'], function(node_id) {
  
  function OrderedSet(web, base, next) {
    this._web  = web;
    this._base = base;
    this._next = next;
  }
  
  OrderedSet.prototype.get = function() {
    var nodes = [];
    
    nodes.push(this._base);
  
    var currentNode = this._base;
    while (true) {
      var nextNode = this.next(currentNode);
      if (!nextNode) {
        break;
      }
      currentNode = nextNode;
      nodes.push(currentNode);
    }
    
    return nodes;
  }
  
  OrderedSet.prototype.previous = function(node) {
    var currentNode = this._base;
    while (true) {
      var nextNode = this.next(currentNode);
      if (!nextNode) {
        break;
      }
      if (node_id.equal(nextNode, node)) {
        return currentNode;
      }
      currentNode = nextNode;
    }
    return null;
  }
  
  OrderedSet.prototype.next = function(node) {
    var result = this._web.query(node, this._next, null);
    if (result && result.size === 1) {
      return Array.from(result)[0]
    } else {
      return null;
    }
  }
  
  OrderedSet.prototype.last = function() {
    var currentNode = this._base;
    while (true) {
      var nextNode = this.next(currentNode);
      if (!nextNode) {
        return currentNode;
      }
      currentNode = nextNode;
    }
  }
  
  OrderedSet.prototype.append = function(node) {
    this._web.addLinks([{
      from: this.last(),
      via: this._next,
      to: node,
    }]);
  }
  
  OrderedSet.prototype.delete = function(node) {
    var previousNode = this.previous(node);
    var nextNode = this.next(node);
    
    var linksToRemove = [];
    
    if (previousNode) {
      linksToRemove.push({
        from: previousNode,
        via: this._next,
        to: node,
      });
    }
    
    if (nextNode) {
      linksToRemove.push({
        from: node,
        via: this._next,
        to: nextNode,
      });
    }
    
    this._web.removeLinks(linksToRemove);
    
    if (previousNode && nextNode) {
      this._web.addLinks([{
        from: previousNode,
        via: this._next,
        to: nextNode,
      }]);
    }
  }

  return function(web, base, next) {
    return new OrderedSet(web, base, next);
  }
});
