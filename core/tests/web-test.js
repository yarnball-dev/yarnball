var Node = require('../node');
var Web  = require('../web');
var test = require('tape');

test('web test', function(t) {
  var web = Web();
  
  t.equal(web.getLinks().length, 0, 'New empty web getLinks().length should be zero.');
  
  var link = {
    from: Node(),
    via:  Node(),
    to:   Node(),
  }
  t.notOk(web.hasLink(link.from, link.via, link.to), 'New empty web should not contain any link.');
  t.doesNotThrow(function() { web.setLinks([link], []); }, 'Web setLinks([link], []) should not throw.');
  t.equal(web.getLinks().length, 1, 'Web getLinks().length should be 1 after setLink([link], []).');
  t.ok(web.hasLink(link.from, link.via, link.to), 'Web hasLink(link) should return true after setLink([link], []).');
  t.doesNotThrow(function() { web.setLinks([], [link]); }, 'Web setLinks([], [link]) should not throw.');
  t.equal(web.getLinks().length, 0, 'Web getLinks().length should be 0 after setLink([], [link]).');
  t.notOk(web.hasLink(link.from, link.via, link.to), 'Web hasLink(link) should return false after setLink([], [link]).');
  
  t.end();
});