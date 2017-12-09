'use strict';

var fs = require('fs');
var test = require('tape');
var babel = require('babel-core');

var pluginPath = require.resolve('../');

var outputExpected = function outputExpected(name) {
  return function (plugins) {
    var output = babel.transformFileSync(__dirname + '/fixtures/' + name + '.source', {
      plugins: [[pluginPath, {
        plugins: plugins
      }]]
    }).code.trim();

    var expected = fs.readFileSync(__dirname + '/fixtures/' + name + '.expected', 'utf-8').trim();

    return { output: output, expected: expected };
  };
};

test('basic rules', function (t) {
  var _outputExpected = outputExpected("rules")([]),
      output = _outputExpected.output,
      expected = _outputExpected.expected;

  t.equal(output, expected, 'output matches expected');
  t.end();
});

test('basic declarations', function (t) {
  var _outputExpected2 = outputExpected("declarations")([]),
      output = _outputExpected2.output,
      expected = _outputExpected2.expected;

  t.equal(output, expected, 'output matches expected');
  t.end();
});

test('basic media', function (t) {
  var _outputExpected3 = outputExpected("media")([]),
      output = _outputExpected3.output,
      expected = _outputExpected3.expected;

  t.equal(output, expected, 'output matches expected');
  t.end();
});

test('different values', function (t) {
  var _outputExpected4 = outputExpected("values")([]),
      output = _outputExpected4.output,
      expected = _outputExpected4.expected;

  t.equal(output, expected, 'output matches expected');
  t.end();
});

test('basic autoprefixing', function (t) {
  var _outputExpected5 = outputExpected("autoprefixer")([require('autoprefixer')]),
      output = _outputExpected5.output,
      expected = _outputExpected5.expected;

  t.equal(output, expected, 'output matches expected');
  t.end();
});

test('important', function (t) {
  var _outputExpected6 = outputExpected("important")([]),
      output = _outputExpected6.output,
      expected = _outputExpected6.expected;

  t.equal(output, expected, 'output matches expected');
  t.end();
});