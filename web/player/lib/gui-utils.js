'use strict';

const guiu = {

	initElements: function (document, elementConfig) {
		const gui = {};
		for (const [id, config] of Object.entries(elementConfig)) {
			// get DOM element
			const element = document.getElementById(id);
			if (!element) {
				throw Error("DOM element with id '" + id + "' does not exist");
			}
			// add to our GUI object
			gui[id] = element; 
			if (!config) {
				// nothing further to do
				continue;
			}
			// just a function provided?
			if (typeof config === 'function') {
				// yes -> single event listener
				addDefaultEventListener(element, config);
				// done
				continue;
			}
			// has 'event' object?
			if (config.event) {
				// yes -> is it a function?
				if (typeof config.event === 'function') {
					// yes -> single listeners
					addDefaultEventListener(element, config.event);
				} else {
					// no -> multiple listeners
					for (const [type, listener] of Object.entries(config.event)) {
						element.addEventListener(type, listener);
					}
				}
			}
			// has 'options' object?
			if (config.options) {
				// yes -> do it
				const options = config.options;
				if (options.wheelable) {
					makeWheelable(element);
				}
			}
		}
		return gui;
	},

	redirectConsole: function(elementId) {
		const element = document.getElementById(elementId);
		const methods = {
			error: { verb: 'error', prefix: '[E] ' },
			warn : { verb: 'warn',  prefix: '[!] ' },
			info : { verb: 'info',  prefix: '[i] ' },
			log  : { verb: 'log',   prefix: '[.] ' },			
		}
		function output(method, ...args) {
			const values = args.map((arg) => {
				if (typeof arg === 'object') {
					return JSON.stringify(arg, null, 2);
				}
				return arg;
			});
			const msg = document.createElement('code');
			msg.classList.add('console-' + method.verb);
			msg.textContent = method.prefix + values.join(' ');
			element.appendChild(msg);
			element.hidden = false;
		}
		for (let method of Object.values(methods)) {
			const wrapped = console[method.verb];
			console[method.verb] = (...args) => {
				wrapped(...args);
				output(method, ...args);
			};
		}
		window.addEventListener('error', (e) => {
			output(methods.error, e.filename+':'+e.lineno+': '+e.message);
		});
	}

}

function addDefaultEventListener(element, listener) {
	const tag = element.tagName.toLowerCase();
	const type = {
		input: 'input',
		button: 'click',
	}[tag]
	if (!type) {
		throw Error("No default event listener for <" + tag + "> element");
	}
	element.addEventListener(type, listener);
}

class Timer {
	constructor(handler, interval) {
		this.handler = handler
		this.interval = interval;
		this.handle = null;
	}

	start() {
		if (!this.active) {
			this.handle = setInterval(this.handler, this.interval);
		}
	}

	stop() {
		if (this.active) {
			clearInterval(this.handle);
			this.handle = null;
		}
	}

	setInterval(interval) {
		this.interval = interval;
		if (this.active) {
			this.stop();
			this.start();
		}
	}

	get active() {
		return this.handle != null;
	}

}

// helpers

function makeWheelable(element) {
    element.addEventListener("wheel", (e) => {
        if (e.deltaY < 0) {
            e.target.value++;
        } else if (e.deltaY > 0) {
            e.target.value--;
		} else {
			// nothing changed
			return;
		}
		// trigger input event
		const event = document.createEvent('Event');
		event.initEvent('input', true, true);
		element.dispatchEvent(event);

    }, { passive: true });
}