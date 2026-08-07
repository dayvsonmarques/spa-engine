(function (global) {
	'use strict';

	function globToRegExp(pattern) {
		var escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
		var withWildcard = escaped.replace(/\*/g, '.*');
		return new RegExp('^' + withWildcard + '$');
	}

	function matchesAnyRoute(routes, pathname) {
		for (var i = 0; i < routes.length; i++) {
			if (globToRegExp(routes[i]).test(pathname)) {
				return true;
			}
		}
		return false;
	}

	function Engine(config) {
		this.routes = (config && config.routes) || [];
		this.enabled = !!(config && config.enabled);

		document.addEventListener('click', this._handleClick.bind(this));
	}

	Engine.prototype._handleClick = function (event) {
		if (!this.enabled) {
			return;
		}

		if (event.defaultPrevented || event.button !== 0) {
			return;
		}

		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}

		var link = event.target.closest('a');

		if (!link || !link.href) {
			return;
		}

		if (link.target === '_blank') {
			return;
		}

		var url = new URL(link.href, window.location.href);

		if (url.origin !== window.location.origin) {
			return;
		}

		if (!matchesAnyRoute(this.routes, url.pathname)) {
			return;
		}

		event.preventDefault();

		console.log('SPA would navigate to:', link.href);
	};

	global.Engine = Engine;
})(window);
