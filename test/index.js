/* jshint node: true */
/*global suite, test, before */
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
        if (data.error) {
          assert.throws(function errorCheck() {
            squig.query(data.parameters, data.values, data.groups);
          }, test.error);
        }
        else if (data.sql) {
          var result = squig.query(data.parameters, data.values, data.groups);
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

suite('Parsing errors', function checkParseErrors() {

  test('Unnamed parameter', function runTest() {
    assert.throws(function errorCheck() {
      new lib.squiggle.Query('test', 'SELECT foo FROM sometable WHERE field = ?');
    }, 'Parse failed, expected parameter name or ( after ?');
  });

  test('Unnamed value', function runTest() {
    assert.throws(function errorCheck() {
      new lib.squiggle.Query('test', 'SELECT foo FROM sometable LIMIT $, 10');
    }, 'Parse failed, expected value name after $');
  });

  test('Unnamed group', function runTest() {
    assert.throws(function errorCheck() {
      new lib.squiggle.Query('test', 'SELECT foo FROM sometable ?(: WHERE available=1)');
    }, 'Parse failed, expected group name after :');
  });
});
