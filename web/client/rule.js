class Rule {
	constructor(array) {
		this.array = array;
		this.states = Math.pow(this.array.length, 1/9);
	}

	encode() {
		const radix = BigInt(this.states);
		let num = this.array.reduce((acc, x) => acc * radix + BigInt(x), BigInt(0));
		const mask = BigInt(0xFF);
		const shift = BigInt(8);
		const num_bytes = getRuleSize(this.states);
		let bytes = "";
		for (let i = 0; i < num_bytes; i++) {
			bytes += String.fromCharCode(Number(num & mask));
			num >>= shift;
		}
		const base64 = btoa(bytes);
		return base64EncodeUrl(base64);
	}

	static decode(str) {
		const base64 = base64DecodeUrl(str);
		const bytes = atob(base64);
		const num_bytes = bytes.length;
		const shift = BigInt(8);
		let num = BigInt(0);
		for (let i = num_bytes-1; i >= 0; i--) {
			num <<= shift;
			num += BigInt(bytes.charCodeAt(i));
		}
		// determine number of states
		let states = null;
		for (let i = 2; i < 256; i++) {
			if (getRuleSize(i) == num_bytes) {
				states = i;
				break;
			}
		}
		const radix = BigInt(states);
		const n = Math.pow(states, 9);
		let array = [];
		for (let i = 0; i < n; i++) {
			array[n-i-1] = Number(num % radix);
			num /= radix;
		}
		return new Rule(array);
	
	}
}

// from https://jsfiddle.net/magikMaker/7bjaT/:
/**
 * use this to make a Base64 encoded string URL friendly, 
 * i.e. '+' and '/' are replaced with '-' and '_' also any trailing '=' 
 * characters are removed
 *
 * @param {String} str the encoded string
 * @returns {String} the URL friendly encoded String
 */
function base64EncodeUrl(str){
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}

/**
 * Use this to recreate a Base64 encoded string that was made URL friendly 
 * using Base64EncodeurlFriendly.
 * '-' and '_' are replaced with '+' and '/' and also it is padded with '+'
 *
 * @param {String} str the encoded string
 * @returns {String} the URL friendly encoded String
 */
function base64DecodeUrl(str){
    str = (str + '===').slice(0, str.length + (str.length % 4));
    return str.replace(/-/g, '+').replace(/_/g, '/');
}

function getRuleSize(states) {
    return Math.ceil(Math.pow(states, 9) * Math.log(states)/Math.log(256));
}
