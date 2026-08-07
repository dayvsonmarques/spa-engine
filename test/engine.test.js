'use strict';

var test = require('node:test');
var assert = require('node:assert');

global.window = global;
global.document = {
	addEventListener: function () {},
};

require('../engine.js');

var globToRegExp = global.Engine._internal.globToRegExp;
var matchesAnyRoute = global.Engine._internal.matchesAnyRoute;

test('globToRegExp matches a wildcard suffix pattern', function () {
	var regExp = globToRegExp('*.html');

	assert.ok(regExp.test('/details.html'));
	assert.ok(!regExp.test('/details.php'));
});

test('globToRegExp matches a wildcard prefix path pattern', function () {
	var regExp = globToRegExp('/site/*');

	assert.ok(regExp.test('/site/foo'));
	assert.ok(!regExp.test('/other/foo'));
});

test('globToRegExp escapes regex special characters in the pattern', function () {
	var regExp = globToRegExp('/a.b+c');

	assert.ok(regExp.test('/a.b+c'));
	assert.ok(!regExp.test('/aXb+c'));
});

test('matchesAnyRoute returns true when any configured route matches', function () {
	assert.ok(matchesAnyRoute(['*.php', '*.html'], '/index.html'));
});

test('matchesAnyRoute returns false when no configured route matches', function () {
	assert.ok(!matchesAnyRoute(['*.php'], '/index.html'));
});

test('matchesAnyRoute returns false for an empty routes list', function () {
	assert.ok(!matchesAnyRoute([], '/index.html'));
});
