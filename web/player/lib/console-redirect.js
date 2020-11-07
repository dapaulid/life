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
function checkDomConsole() {
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
	return !!domConsole;
}

function outputEntry(entry) {
	// console ready?
	if (checkDomConsole()) {
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

// redirect unhandled exception traces
window.addEventListener('error', function(e) {
	output(METHODS.error, [removeCommonPrefix(e.filename, window.location.href)+':'+e.lineno+': '+e.message]);
});

// assign console when DOM loaded
window.addEventListener('load', checkDomConsole);

/*
	helpers
*/
function removeCommonPrefix(str, other) {
	if (!str || !other) {
		return str;
	}
	var l = 0;
	while ((l < str.length) && (l < other.length) && (str[l] === other[l])) {
		l++;
	}
	return str.substring(l);
}

})(); // end module	
