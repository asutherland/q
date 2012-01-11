'use strict';

var Q = require('../q');

exports['test report unprocessed rejections'] = function(assert, done) {
  Q.loggingEnableFriendly({
    unhandledRejections: function(reason) {
      assert.equal(reason.message, 'cow', 'got exception');
      done();
    }
  });

  var deferred = Q.defer();
  var whenPromise = Q.when
  ( deferred.promise
  , function() {
      throw new Error('cow');
    }
  , function() {
      throw new Error('moo');
    }
  );
  deferred.resolve(true);
};

/**
 * Delay a test some number of event loop turns in order to make sure that
 * the promises mechanism got a chance for all of their delays to work out.
 */
function deferTicks(numTicks, callback) {
  function counter() {
    if (--numTicks) {
      Q.nextTick(counter);
      return;
    }
    callback();
  }
  Q.nextTick(counter);
}

exports['test track unresolved promises'] = function(assert, done) {
  Q.loggingEnableFriendly({
    trackLive: true,
  });
  var A = Q.defer('A');
  assert.deepEqual(Q.friendlyUnresolvedDeferreds(), ['A'],
                   'A initially unresolved');
  A.resolve('a');
  // The trace happens when resolve is called, not when the resolution is
  // heard by 'listeners'.
  assert.deepEqual(Q.friendlyUnresolvedDeferreds(), [],
                   'A immediately resolved');

  var X = Q.defer('X'),
      Y = Q.when(X.promise, function() {}, function() {}, 'Y');
  assert.deepEqual(Q.friendlyUnresolvedDeferreds(), ['X', 'Y'],
                   'X, Y immediately unresolved');

  deferTicks(10, function() {
    assert.deepEqual(Q.friendlyUnresolvedDeferreds(), ['X', 'Y'],
                     'X, Y remain unresolved');

    X.resolve('x');
    deferTicks(10, function() {
      assert.deepEqual(Q.friendlyUnresolvedDeferreds(), [],
                       'X, Y resolved');
      done();
    });
  });
};

exports['test reset logging status'] = function(assert) {
  Q.loggingDisable();
};

if (module == require.main) require('test').run(exports);
