(function (global) {
	'use strict';

	function Engine(config) {
		this.routes = (config && config.routes) || [];
		this.enabled = !!(config && config.enabled);
	}

	global.Engine = Engine;
})(window);
