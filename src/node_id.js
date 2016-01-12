if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

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
    
  function fromHex(hexString) {
    if (hexString.length !== 16*2) {
      throw "Can't convert hex string '" + hexString + "' to node id, length is not 32.";
    }
    var array = new Uint8Array(16);
    for (var i=0; i<16; i++) {
      var hex = hexString.slice(i*2, (i*2) + 2);
      var int = parseInt(hex, 16);
      array[i] = int;
    }
    return array.buffer;
  }
  
  return {
    make:       make,
    equal:      equal,
    toMapKey:   toMapKey,
    fromMapKey: fromMapKey,
    toHex:      toHex,
    fromHex:    fromHex,
  }
});
