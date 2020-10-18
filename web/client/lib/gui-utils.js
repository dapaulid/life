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
				// yes -> use it as default eventhandler
				element.addEventListener('click', config);
				// done
				continue;
			}
			// has 'events' object?
			if (config.events) {
				// yes -> create listener
				for (const [type, listener] of Object.entries(config.events)) {
					element.addEventListener(type, listener);
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
	}

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