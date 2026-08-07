(global => {
	'use strict';

	const globToRegExp = (pattern) => {
		const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
		const withWildcard = escaped.replace(/\*/g, '.*');
		return new RegExp(`^${withWildcard}$`);
	};

	const matchesAnyRoute = (routes, pathname) =>
		routes.some((route) => globToRegExp(route).test(pathname));

	const swapBodyPreservingComponents = (newBody) => {
		const cachedComponents = {};
		const oldComponents = document.body.querySelectorAll('[data-spa-component]');

		oldComponents.forEach((oldComponent) => {
			cachedComponents[oldComponent.getAttribute('data-spa-component')] = oldComponent;
		});

		const newComponents = newBody.querySelectorAll('[data-spa-component]');

		newComponents.forEach((newComponent) => {
			const cached = cachedComponents[newComponent.getAttribute('data-spa-component')];

			if (cached) {
				newComponent.parentNode.replaceChild(cached, newComponent);
			}
		});

		while (document.body.firstChild) {
			document.body.removeChild(document.body.firstChild);
		}

		while (newBody.firstChild) {
			document.body.appendChild(newBody.firstChild);
		}
	};

	const getLoadingBar = () => {
		let bar = document.getElementById('spa-loading-bar');

		if (!bar) {
			bar = document.createElement('div');
			bar.id = 'spa-loading-bar';
			bar.style.cssText = `
				position: fixed; top: 0; left: 0; height: 3px; width: 0;
				background: #2684ff; transition: width .2s ease, opacity .2s ease;
				z-index: 9999; opacity: 1;
			`;
			document.documentElement.appendChild(bar);
		}

		return bar;
	};

	const showLoadingBar = () => {
		const bar = getLoadingBar();

		bar.style.opacity = '1';
		bar.style.width = '0';

		window.requestAnimationFrame(() => {
			bar.style.width = '80%';
		});
	};

	const hideLoadingBar = () => {
		const bar = document.getElementById('spa-loading-bar');

		if (!bar) {
			return;
		}

		bar.style.width = '100%';

		window.setTimeout(() => {
			bar.style.opacity = '0';
		}, 200);
	};

	const executeScriptsInOrder = (scripts) => {
		let index = 0;

		const runNext = () => {
			if (index >= scripts.length) {
				return;
			}

			const oldScript = scripts[index];
			const newScript = document.createElement('script');

			Array.from(oldScript.attributes).forEach((attr) => {
				newScript.setAttribute(attr.name, attr.value);
			});

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
		};

		runNext();
	};

	class Engine {
		constructor(config) {
			this.routes = (config && config.routes) || [];
			this.enabled = !!(config && config.enabled);

			document.addEventListener('click', this._handleClick);
			window.addEventListener('popstate', this._handlePopState);
		}

		_handleClick = (event) => {
			if (!this.enabled) {
				return;
			}

			if (event.defaultPrevented) {
				return;
			}

			if (event.button !== 0) {
				return;
			}

			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return;
			}

			const link = event.target.closest('a');

			if (!link || !link.href) {
				return;
			}

			if (link.target === '_blank') {
				return;
			}

			if (link.hasAttribute('data-no-spa')) {
				return;
			}

			const url = new URL(link.href, window.location.href);

			if (url.origin !== window.location.origin) {
				return;
			}

			if (!matchesAnyRoute(this.routes, url.pathname)) {
				return;
			}

			event.preventDefault();

			this._navigate(link.href, true);
		};

		_handlePopState = () => {
			if (!this.enabled) {
				return;
			}

			this._navigate(window.location.href, false);
		};

		_navigate = async (href, updateHistory) => {
			showLoadingBar();

			try {
				const response = await fetch(href);

				if (!response.ok) {
					throw new Error(`Bad response status: ${response.status}`);
				}

				const html = await response.text();
				const parser = new DOMParser();
				const newDocument = parser.parseFromString(html, 'text/html');

				if (!newDocument.body) {
					throw new Error('Response has no <body>');
				}

				const scripts = Array.from(newDocument.body.querySelectorAll('script'));

				scripts.forEach((script) => script.parentNode.removeChild(script));

				swapBodyPreservingComponents(newDocument.body);

				if (updateHistory) {
					history.pushState(null, '', href);
				}

				hideLoadingBar();

				executeScriptsInOrder(scripts);
			} catch (error) {
				window.location.href = href;
			}
		};
	}

	Engine._internal = {
		globToRegExp,
		matchesAnyRoute,
	};

	global.Engine = Engine;
})(window);
