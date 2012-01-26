'use strict';

var Q = require('../q'),
    fs = require('fs'),
    enqueue = Q.nextTick;

exports['test cake baking example'] = function(assert, done) {
  Q.loggingEnableCauseway();

  function getIngredients(fresh) {
    if (!fresh) {
      // send our primary butler to the store
      var ingredients = Q.defer("ingredients");
      enqueue(function() { ingredients.resolve(["milk!", "eggs!"]); });
      return ingredients.promise;
    }

    // send our primary butler to the dairy
    var milk = Q.defer("milk");
    enqueue(function() { milk.resolve("milk!"); });

    // send our secondary butler to the eggery
    var eggs = Q.defer("eggs");
    enqueue(function() { eggs.resolve("eggs!"); });

    return Q.all([milk.promise, eggs.promise], "ingredients");
  }

  function mix(ingredients) {
    // we use a mixing machine to do most of the work; it's async...
    var mixing = Q.defer("mix");
    enqueue(function() { mixing.resolve("batter!"); });
    return mixing.promise;
  }

  function bake(batter) {
    var baked = Q.defer("bake");
    enqueue(function() { baked.resolve("fully baked cake!"); });
    return baked.promise;
  }

  function ice() {
    return "iced cake";
  }

  function makeCake(freshIngredients) {
    // should backlink to ingredients
    var mixed = Q.when(getIngredients(freshIngredients), mix);
    // should backlink to mixed
    var baked = Q.when(mixed, bake);
    // should backlink to baked
    var iced = Q.when(baked, ice, null, "cake");

    return iced;
  }

  var cakeDone = makeCake(true);
  Q.when(cakeDone, function() {
    /*
    var ptree = treeifyPromise(cakeDone);
    var expectedTree = {"tree":
      {
        "name": "cake",
        "kids": [
          {
            name: "auto:ice",
            kids: [
              {
                name: "auto:bake",
                kids: [
                  {
                    name: "auto:mix",
                    kids: [
                      {
                        "name": "ingredients",
                        "kids": [ // parallel run of...
                          "milk",
                          "eggs"
                        ]
                      },
                      "mix",
                    ]
                  },
                  "bake",
                ]
              },
            ],
          },
        ]
      }
    };
    test.assertEqual(JSON.stringify({tree: ptree}),
                     JSON.stringify(expectedTree),
                     "resulting tree structure");
    */

    var jsonStr = JSON.stringify(Q.causewayResetLog(), null, 2);
    fs.writeFileSync('/tmp/causeway.json', jsonStr);
    done();
  });

};

exports['test reset logging status'] = function(assert) {
  Q.loggingDisable();
};

process.on("uncaughtException",
  function(err) {
    console.error("==== UNCAUGHT ====");
    console.error(err.message);
    console.error(err);
    console.error(err.stack);
    if (DEATH_PRONE)
      process.exit(1);
  });

if (module == require.main) require('test').run(exports);
