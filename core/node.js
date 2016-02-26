// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(function() {
  
  function Node(buffer) {
    
    if (buffer) {
      if (!(buffer instanceof ArrayBuffer)) {
        throw 'Cannot create node ID, the given parameter is not an ArrayBuffer';
      }
      if (buffer.byteLength != 16) {
        throw 'Cannot create node ID, the given buffer is not 16 bytes.';
      }
    } else {
      buffer = new ArrayBuffer(16);
    }
    
    if (typeof window === 'object' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(new Uint8Array(buffer));
    } else if (typeof window === 'object' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
      window.msCrypto.getRandomValues(new Uint8Array(buffer));
    } else {
      var nodeCrypto = require('crypto');
      var bytes = nodeCrypto.randomBytes(16);
      var bufferView = new Uint8Array(buffer);
      bufferView.set(bytes);
    }
    
    return buffer;
  }
  
  Node.isNode = function(object) {
    return (object instanceof ArrayBuffer || (typeof Buffer !== 'undefined' && object instanceof Buffer)) && object.byteLength === 16;
  }
  
  Node.equal = function(a, b) {
    if (!Node.isNode(a) || !Node.isNode(b)) {
      throw 'Cannot compare node equality, given parameter(s) are not nodes.';
    }
    return Node.toMapKey(a) === Node.toMapKey(b);
  }
  
  Node.toMapKey = function(node) {
    if (!Node.isNode(node)) {
      throw 'Cannot convert node to map key, parameter is not a node.';
    }
    return Array.from(new Uint8Array(node)).toString();
  }
  
  Node.fromMapKey = function(key) {
    return new Uint8Array(JSON.parse('[' + key + ']')).buffer;
  }
    
  Node.toHex = function(node) {
    if (!Node.isNode(node)) {
      throw 'Cannot convert node to hex string, parameter is not a node.';
    }
    var array = new Uint8Array(node);
    var hexString = "";
    array.forEach(function(v) {
      var hex = v.toString(16);
      if (hex.length === 1) {
        hex = "0" + hex;
      }
      hexString += hex;
    });
    return hexString;
  }
  
  Node.makeHex = function() {
    var node = Node();
    return Node.toHex(node);
  }
    
  Node.fromHex = function(hexString) {
    if (hexString.length !== 16*2) {
      throw "Can't convert hex string '" + hexString + "' to node id, length is not 32.";
    }
    var array = new Uint8Array(16);
    for (var i=0; i<16; i++) {
      var hex = hexString.slice(i*2, (i*2) + 2);
      var int = parseInt(hex, 16);
      if (isNaN(int)) {
        throw "Can't convert hex string '" + hexString + "' to node id, characters '" + hex + "' could not be converted to an integer.";
      }
      array[i] = int;
    }
    return array.buffer;
  }
  
  Node.linkToKey = function(link) {
    if (!link.from || !link.via || !link.to) {
      throw 'Cannot make key for link, from, via or to not specified.';
    }
    return Node.toHex(link.from) +
           Node.toHex(link.via) +
           Node.toHex(link.to);
  }
  
  Node.linkFromKey = function(linkKey) {
    if (linkKey.length !== 32 + 32 + 32) {
      throw 'Cannot get link from key, key length is incorrect.';
    }
    return {
      from: Node.fromHex(linkKey.slice(0, 32)),
      via:  Node.fromHex(linkKey.slice(32, 32 + 32)),
      to:   Node.fromHex(linkKey.slice(32 + 32, 32 + 32 + 32)),
    }
  }
  
  Node.linksEqual = function(link1, link2) {
    return Node.equal(link1.from, link2.from) &&
           Node.equal(link1.via,  link2.via) &&
           Node.equal(link1.to,   link2.to);
  }
  
  return Node;
});
