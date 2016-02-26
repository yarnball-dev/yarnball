// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./node_id', './web'], function(node_id, Web) {
  
  function Transaction(web) {
    this._targetWeb = web;
    this._stagedAdditions = Web();
    this._stagedRemovals  = Web();
  }
  
  Transaction.prototype.apply = function() {
    var add    = this._stagedAdditions.getLinks();
    var remove = this._stagedRemovals.getLinks();
    if (add.length > 0 || remove.length > 0) {
      this._targetWeb.setLinks(add, remove);
      this._stagedAdditions.clear();
      this._stagedRemovals.clear();
    }
  }
  
  
  // Links
  
  Transaction.prototype.setLinks = function(add, remove) {
    this._stagedAdditions.setLinks(add, remove);
    this._stagedRemovals.setLinks(remove, add);
  }
  
  
  // Query
  
  Transaction.prototype.hasLink = function(from, via, to) {
    return   this._stagedAdditions.hasLink(from, via, to) ||
           (!this._stagedRemovals.hasLink(from, via, to) &&
             this._targetWeb.hasLink(from, via, to));
  }
  
  Transaction.prototype.query = function(from, via, to) {
    var result = this._targetWeb.query(from, via, to);
    result.addSet(this._stagedAdditions.query(from, via, to));
    result.deleteSet(this._stagedRemovals.query(from, via, to));
    return result;
  }
  
  Transaction.prototype.queryOne = function(from, via, to) {
    if ((from ? 1:0) + (via ? 1:0) + (to ? 1:0) !== 2) {
      throw 'Invalid query';
    }
    
    var result = Array.from(this._stagedAdditions.query(from, via, to));
    for (var i=0; i < result.length; i++) {
      var link = {
        from: from ? from : result[i],
        via:  via  ? via  : result[i],
        to:   to   ? to   : result[i],
      }
      if (!this._stagedRemovals.hasLink(link.from, link.via, link.to)) {
        return result[i];
      }
    }
    
    result = this._targetWeb.query(from, via, to);
    for (var i=0; i < result.length; i++) {
      var link = {
        from: from ? from : result[i],
        via:  via  ? via  : result[i],
        to:   to   ? to   : result[i],
      }
      if (!this._stagedRemovals.hasLink(link.from, link.via, link.to)) {
        return result[i];
      }
    }
  }
  
  
  return function(web) {
    return new Transaction(web);
  }
});