var Users = require('./users');
var exec  = require('child_process').exec;
var test  = require('tape');

test('users test', function(t) {
  
  exec('mkdir -p /tmp/yarnball-users-test/db/', function(err, stdout, stderr) {
    t.notOk(err, 'Executing mkdir to create /tmp/yarnball-users-test/db/ should not output an error.');
  }).on('exit', function() {
    
    var users = null;
    t.doesNotThrow(function() {
      users = Users('/tmp/yarnball-users-test/db', '/tmp/yarnball-users-test/users');
    }, 'Calling Users constructor on a path to a valid directory should not throw.');
    
    users.hasUser('non-existant-user').then(function(hasUser) {
      t.notOk(hasUser, 'Calling hasUser() on new empty users database should return false.');
    })
    
    .then(function() {
      return users.createUser('peach', 'password').then(function() {
          t.ok(true, 'createUser() should succeed.');
        },
        function(err) {
          t.notOk(err, 'createUser() should not throw: ' + err);
        }
      );
    })
    
    .then(function() {
      return users.createUser('meewii', 'loki').then(function() {
          t.ok(true, 'createUser() should succeed.');
        },
        function(err) {
          t.notOk(err, 'createUser() should not throw: ' + err);
        }
      );
    })
    
    .then(function() {
      return users.getUserWeb('meewii').then(function(web) {
          t.ok(web, 'getUserWeb() should return a web for a user created with createUser()');
        },
        function(err) {
          t.notOk(err, 'getUserWeb() should not throw.');
        }
      );
    })
    
    .then(function() {
      return users.hasUser('peach').then(function(hasUser) {
          t.ok(hasUser, 'hasUser() should return true for a username previously given to addUser()');
        },
        function(err) {
          t.notOk(err, 'hasUser() should not throw: ' + err);
        }
      );
    })
    
    .then(function() {
      return users.getUsernames().then(function(usernames) {
          usernames = new Set(usernames);
          t.ok(usernames.has('peach'),  'getUsernames() should return usernames passed to addUser()');
          t.ok(usernames.has('meewii'), 'getUsernames() should return usernames passed to addUser()');
        },
        function(err) {
          t.notOk(err, 'getUsernames() should not throw: ' + err);
        }
      );
    })
    
    .catch(function(err) {
      t.notOk(false, err);
    }).then(function() {
      t.doesNotThrow(function() {
        users.close();
      }, 'close() should not throw.');
      
      t.end();
      
      exec('rm -r /tmp/yarnball-users-test', function(err, stdout, stderr) {
        if (err) {
          console.log(err);
        }
      });
    });
  });
});