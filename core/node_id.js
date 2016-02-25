// Allow this AMD module to be loaded in Node.js
// See https://www.npmjs.com/package/amdefine
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(function() {
  
  function make(buffer) {
    
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
  
  function equal(a, b) {
    return toMapKey(a) === toMapKey(b);
  }
  
  function toMapKey(id) {
    return Array.from(new Uint8Array(id)).toString();
  }
  
  function fromMapKey(key) {
    return new Uint8Array(JSON.parse('[' + key + ']')).buffer;
  }
    
  function toHex(id) {
    var array = new Uint8Array(id);
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
  
  function makeHex() {
    var id = make();
    return toHex(id);
  }
    
  function fromHex(hexString) {
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
  
  function linkToKey(link) {
    if (!link.from || !link.via || !link.to) {
      throw 'Cannot make key for link, from, via or to not specified.';
    }
    return toHex(link.from) +
           toHex(link.via) +
           toHex(link.to);
  }
  
  function linkFromKey(linkKey) {
    if (linkKey.length !== 32 + 32 + 32) {
      throw 'Cannot get link from key, key length is incorrect.';
    }
    return {
      from: fromHex(linkKey.slice(0, 32)),
      via:  fromHex(linkKey.slice(32, 32 + 32)),
      to:   fromHex(linkKey.slice(32 + 32, 32 + 32 + 32)),
    }
  }
  
  return {
    make:        make,
    equal:       equal,
    toMapKey:    toMapKey,
    fromMapKey:  fromMapKey,
    toHex:       toHex,
    makeHex:     makeHex,
    fromHex:     fromHex,
    linkToKey:   linkToKey,
    linkFromKey: linkFromKey,
  }
});
