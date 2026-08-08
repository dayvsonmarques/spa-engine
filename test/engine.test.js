'use strict';

const test = require('node:test');
const assert = require('node:assert');

global.window = global;
global.document = {
	addEventListener: function () {},
};

require('../engine.js');

const { globToRegExp, matchesAnyRoute } = global.Engine._internal;

test('globToRegExp matches a wildcard suffix pattern', () => {
	const regExp = globToRegExp('*.html');

	assert.ok(regExp.test('/details.html'));
	assert.ok(!regExp.test('/details.php'));
});

test('globToRegExp matches a wildcard prefix path pattern', () => {
	const regExp = globToRegExp('/site/*');

	assert.ok(regExp.test('/site/foo'));
	assert.ok(!regExp.test('/other/foo'));
});

test('globToRegExp escapes regex special characters in the pattern', () => {
	const regExp = globToRegExp('/a.b+c');

	assert.ok(regExp.test('/a.b+c'));
	assert.ok(!regExp.test('/aXb+c'));
});

test('matchesAnyRoute returns true when any configured route matches', () => {
	assert.ok(matchesAnyRoute(['*.php', '*.html'], '/index.html'));
});

test('matchesAnyRoute returns false when no configured route matches', () => {
	assert.ok(!matchesAnyRoute(['*.php'], '/index.html'));
});

test('matchesAnyRoute returns false for an empty routes list', () => {
	assert.ok(!matchesAnyRoute([], '/index.html'));
});
