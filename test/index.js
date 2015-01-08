/* jshint node: true */
/*global suite, test */
'use strict';

var lib = {
  fs: require('fs'),
  path: require('path'),
  assert: require('assert'),
  yaml: require('yaml-js'),
  squiggle: require('../')
};

var assert = lib.assert;

var caseFile = lib.path.join(__dirname, 'cases.yml');
var caseYaml = lib.fs.readFileSync(caseFile, 'utf8');
var tests = lib.yaml.load(caseYaml);

tests.forEach(function createSuite(testSuite) {
  suite(testSuite.name, function runTestSuite() {
    var squig = new lib.squiggle.Query('test', testSuite.query);

    testSuite.tests.forEach(function addTest(data, idx) {
      data.args = data.args || [];

      test('Input set #' + idx, function runTest() {
        var spec = {
          params: data.parameters,
          values: data.values,
          groups: data.groups
        };

        if (data.error) {
          assert.throws(function errorCheck() {
            squig.query(spec);
          }, function(err) {
            return err.message === data.error;
          });
        }
        else if (data.sql) {
          var result = squig.query(spec);
          assert.equal(result.sql, data.sql);
          assert.deepEqual(result.params, data.args);
        }
        else {
          throw new Error('Invalid test #' + idx + ' for ' + JSON.stringify(testSuite.name));
        }
      });
    });
  });
});

suite('Consistent ids', function checkIds() {
  var squig = new lib.squiggle.Query('test',
    'SELECT foo FROM sometable ' +
    'WHERE field = ?field ?(:name AND foo="bar") ' +
    'LIMIT 0, $limit');
  var fullSpec = {
    params: {field:1},
    values: {limit:10},
    groups: {name:true}
  };

  test('All attributes are included', function runTest() {
    var id = squig.id(fullSpec);

    assert.equal(id, 'test:field=1:limit=10:name=true');
  });

  test('Omitted attributes yeild empty strings', function runTest() {
    var id = squig.id({});

    assert.equal(id, 'test:::');
  });
});

suite('Parsing errors', function checkParseErrors() {

  test('Unnamed parameter', function runTest() {
    assert.throws(function errorCheck() {
      return new lib.squiggle.Query('test', 'SELECT foo FROM sometable WHERE field = ?');
    }, /expected parameter name/);
  });

  test('Unnamed value', function runTest() {
    assert.throws(function errorCheck() {
      return new lib.squiggle.Query('test', 'SELECT foo FROM sometable LIMIT $, 10');
    }, /expected value name/);
  });

  test('Unnamed group', function runTest() {
    assert.throws(function errorCheck() {
      return new lib.squiggle.Query('test', 'SELECT foo FROM sometable ?(: WHERE available=1)');
    }, /expected group name/);
  });

  test('Unterminated group', function runTest() {
    assert.throws(function errorCheck() {
      return new lib.squiggle.Query('test', 'SELECT foo FROM sometable ?( WHERE available=1');
    }, /unterminated group/);
  });
});
