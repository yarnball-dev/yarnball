// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./node_id'], function(node_id) {
  
  function Map_(web, base) {
    if (!web) {
      throw 'Cannot create map, web not specified.';
    }
    if (!base) {
      throw 'Cannot create map, base not specified.';
    }
    
    this._web = web;
    this._base = base;
  }
  
  Map_.prototype.hasValidValue = function(key) {
    return this._web.query(this._base, key, null).length === 1;
  }
  
  Map_.prototype.get = function(key) {
    var results = this._web.query(this._base, key, null);
    if (results.length > 1) {
      throw 'Multiple results found for key in map.';
    }
    if (results.length === 1) {
      return Array.from(results)[0];
    } else {
      return null;
    }
  }
  
  Map_.prototype.getMap = function(key) {
    var value = this.get(key);
    if (value) {
      return new Map_(this._web, value);
    } else {
      return null;
    }
  }
  
  Map_.prototype.set = function(key, value) {
    var self = this;
    var results = self._web.query(self._base, key, null);
    var linksToAdd    = [];
    var linksToRemove = [];
    var hasValue = false;
    results.forEach(function(result) {
      if (node_id.equal(result, value)) {
        hasValue = true;
      } else {
        linksToRemove.push({
          from: self._base,
          via: key,
          to: result,
        });
      }
    });
    if (!hasValue) {
      linksToAdd.push({
        from: self._base,
        via: key,
        to: value,
      });
    }
    
    if (linksToAdd.length > 0 || linksToRemove.length > 0) {
      self._web.setLinks(linksToAdd, linksToRemove);
    }
  }
  
  Map_.prototype.getOrMake = function(key) {
    var self = this;
    var results = self._web.query(self._base, key, null);
    if (results.length === 0) {
      var value = node_id.make();
      self._web.setLinks([{
        from: self._base,
        via: key,
        to: value,
      }], []);
      return value;
    } else if (results.length === 1) {
      return results[0];
    } else if (results.length > 1) {
      var linksToRemove = results.map(function(result) {
        return {
          from: self._base,
          via: key,
          to: result,
        }
      });
      var value = node_id.make();
      self._web.setLinks(
        [
          {
            from: self._base,
            via: key,
            to: value,
          }
        ],
        linksToRemove
      );
      return value;
    }
  }
  
  Map_.prototype.delete = function(key, value) {
    var self = this;
    if (value) {
      self._web.setLinks([], [{
        from: self._base,
        via: key,
        to: value,
      }]);
    } else {
      var results = self._web.query(self._base, key, null);
      var linksToRemove = results.map(function(value) {
        return {
          from: self._base,
          via: key,
          to: value,
        }
      });
      if (linksToRemove.length > 0) {
        self._web.setLinks([], linksToRemove);
      }
    }
  }
  
  return function(web, base) {
    return new Map_(web, base);
  }
});