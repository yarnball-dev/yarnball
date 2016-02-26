var Node = require('../node');
var test = require('tape');

test('node test', function(t) {
  var n1 = Node();
  var n2 = Node();
  
  t.notOk(Node.equal(n1, n2), 'Two created nodes should not be equal.');
  t.ok(Node.equal(n1, n1), 'Node should compare equal to itself.');
  
  t.notEqual(Node.toMapKey(n1), Node.toMapKey(n2), 'Two created node map keys should not be equal.');
  t.equal(Node.toMapKey(n1), Node.toMapKey(n1), 'Map keys for the same node should compare equal.');
  t.ok(Node.equal(Node.fromMapKey(Node.toMapKey(n1)), Node.fromMapKey(Node.toMapKey(n1))), 'Node -> map key -> node should compare equal.');
  
  t.notEqual(Node.toHex(n1), Node.toHex(n2), 'Hex strings of two nodes should not be equal.');
  t.equal(Node.toHex(n1), Node.toHex(n1), 'Hex strings for the same node should be equal.');
  t.ok(Node.equal(Node.fromHex(Node.toHex(n1)), Node.fromHex(Node.toHex(n1))), 'Node -> hex -> node should compare equal.');
  
  t.notEqual(Node.makeHex(), Node.makeHex(), 'Two calls to makeHex() should return different values.');
  
  var l1 = {
    from: Node(),
    via:  Node(),
    to:   Node(),
  }
  
  var l2 = {
    from: Node(),
    via:  Node(),
    to:   Node(),
  }
  
  t.notEqual(Node.linkToKey(l1), Node.linkToKey(l2), 'Key for two different links should not be equal.');
  t.equal(Node.linkToKey(l1), Node.linkToKey(l1), 'Keys for the same link should be equal.');
  t.ok(Node.linksEqual(Node.linkFromKey(Node.linkToKey(l1)), Node.linkFromKey(Node.linkToKey(l1))), 'Link -> key -> link should compare equal.');
  
  t.end();
});