/* jshint esversion: 3 */

(function() { // begin module
'use strict';

var CONSOLE_ID = "console";

var METHODS = {
	error: { verb: 'error', prefix: '[E] ' },
	warn : { verb: 'warn',  prefix: '[!] ' },
	info : { verb: 'info',  prefix: '[i] ' },
	log  : { verb: 'log',   prefix: '[.] ' }
};

var domConsole = null;
var bufferedEntries = [];

function outputEntry(entry) {
	// lazily lookup console element
	if (!domConsole) {
		// console element available?
		domConsole = document.getElementById(CONSOLE_ID);
		if (domConsole) {
			// yes -> output buffered entries
			bufferedEntries.forEach(outputEntry);
			bufferedEntries = [];
		}
	}
	// console ready?
	if (domConsole) {
		// yes -> do it
		var msg = document.createElement('code');
		msg.classList.add('console-' + entry.method.verb);
		msg.textContent = entry.method.prefix + entry.message;
		domConsole.appendChild(msg);
		domConsole.hidden = false;
	} else {
		// no -> use buffer
		bufferedEntries.push(entry);
	}
}

function output(method, args) {
	var values = args.map( function(arg) {
		if (typeof arg === 'object') {
			try {
				return JSON.stringify(arg, null, 2);
			} catch (e) {
				return "<" + arg + ": " + e + ">";
			}
		}
		return arg;
	});
	outputEntry({ method: method, message: values.join(' ') });
}

Object.values(METHODS).forEach(function(method) {
	var wrapped = console[method.verb];
	console[method.verb] = function(/*arguments*/) {
		wrapped.apply(null, arguments);
		output(method, Array.prototype.slice.call(arguments));
	};
});
window.addEventListener('error', function(e) {
	output(METHODS.error, [e.filename+':'+e.lineno+': '+e.message]);
});

})(); // end module	
