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

	function executeScriptsInOrder(scripts) {
		var index = 0;

		function runNext() {
			if (index >= scripts.length) {
				return;
			}

			var oldScript = scripts[index];
			var newScript = document.createElement('script');

			for (var i = 0; i < oldScript.attributes.length; i++) {
				var attr = oldScript.attributes[i];
				newScript.setAttribute(attr.name, attr.value);
			}

			index++;

			if (oldScript.src) {
				newScript.onload = runNext;
				newScript.onerror = runNext;
				document.body.appendChild(newScript);
			} else {
				newScript.textContent = oldScript.textContent;
				document.body.appendChild(newScript);
				runNext();
			}
		}

		runNext();
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

		this._navigate(link.href);
	};

	Engine.prototype._navigate = function (href) {
		fetch(href)
			.then(function (response) {
				if (!response.ok) {
					throw new Error('Bad response status: ' + response.status);
				}
				return response.text();
			})
			.then(function (html) {
				var parser = new DOMParser();
				var newDocument = parser.parseFromString(html, 'text/html');

				if (!newDocument.body) {
					throw new Error('Response has no <body>');
				}

				var scripts = Array.prototype.slice.call(
					newDocument.body.querySelectorAll('script')
				);

				scripts.forEach(function (script) {
					script.parentNode.removeChild(script);
				});

				document.body.innerHTML = newDocument.body.innerHTML;

				executeScriptsInOrder(scripts);
			});
	};

	global.Engine = Engine;
})(window);
