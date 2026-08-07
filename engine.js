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

	function swapBodyPreservingComponents(newBody) {
		var cachedComponents = {};
		var oldComponents = document.body.querySelectorAll('[data-spa-component]');

		for (var i = 0; i < oldComponents.length; i++) {
			var oldComponent = oldComponents[i];
			cachedComponents[oldComponent.getAttribute('data-spa-component')] = oldComponent;
		}

		var newComponents = newBody.querySelectorAll('[data-spa-component]');

		for (var j = 0; j < newComponents.length; j++) {
			var newComponent = newComponents[j];
			var cached = cachedComponents[newComponent.getAttribute('data-spa-component')];

			if (cached) {
				newComponent.parentNode.replaceChild(cached, newComponent);
			}
		}

		while (document.body.firstChild) {
			document.body.removeChild(document.body.firstChild);
		}

		while (newBody.firstChild) {
			document.body.appendChild(newBody.firstChild);
		}
	}

	function getLoadingBar() {
		var bar = document.getElementById('spa-loading-bar');

		if (!bar) {
			bar = document.createElement('div');
			bar.id = 'spa-loading-bar';
			bar.style.cssText =
				'position:fixed;top:0;left:0;height:3px;width:0;' +
				'background:#2684ff;transition:width .2s ease,opacity .2s ease;' +
				'z-index:9999;opacity:1;';
			document.documentElement.appendChild(bar);
		}

		return bar;
	}

	function showLoadingBar() {
		var bar = getLoadingBar();

		bar.style.opacity = '1';
		bar.style.width = '0';

		window.requestAnimationFrame(function () {
			bar.style.width = '80%';
		});
	}

	function hideLoadingBar() {
		var bar = document.getElementById('spa-loading-bar');

		if (!bar) {
			return;
		}

		bar.style.width = '100%';

		window.setTimeout(function () {
			bar.style.opacity = '0';
		}, 200);
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
		window.addEventListener('popstate', this._handlePopState.bind(this));
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

		if (link.hasAttribute('data-no-spa')) {
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

		this._navigate(link.href, true);
	};

	Engine.prototype._handlePopState = function () {
		if (!this.enabled) {
			return;
		}

		this._navigate(window.location.href, false);
	};

	Engine.prototype._navigate = function (href, updateHistory) {
		showLoadingBar();

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

				swapBodyPreservingComponents(newDocument.body);

				if (updateHistory) {
					history.pushState(null, '', href);
				}

				hideLoadingBar();

				executeScriptsInOrder(scripts);
			})
			.catch(function () {
				window.location.href = href;
			});
	};

	Engine._internal = {
		globToRegExp: globToRegExp,
		matchesAnyRoute: matchesAnyRoute,
	};

	global.Engine = Engine;
})(window);
