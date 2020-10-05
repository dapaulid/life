
/** 
 * the base64 alphabet used for rule encoding. 
 * it is chosen to be URL friendly and maintain 0 for zero bits. 
 */
const B64_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-";
const B64_IDX = {}
for (let i = 0; i < B64_CHARS.length; i++) {
	B64_IDX[B64_CHARS[i]] = i;
}

// constants for BigInt operations
const B64_MASK  = 0x3Fn
const B64_SHIFT = 6n;


class Rule {

	constructor(array) {
		this.array = array;
		this.states = Math.pow(this.array.length, 1/9);
	}

	encode() {
		const radix = BigInt(this.states);
		let num = this.array.reduce((acc, x) => acc * radix + BigInt(x), BigInt(0));
		const len = getRuleSize(this.states);
		let encoded = "";
		for (let i = 0; i < len; i++) {
			encoded += B64_CHARS[Number(num & B64_MASK)];
			num >>= B64_SHIFT;
		}
		return encoded;
	}

	static decode(str) {
		// determine number of states
		let states = null;
		for (let i = 2; i < 256; i++) {
			if (getRuleSize(i) == str.length) {
				states = i;
				break;
			}
		}
		let num = BigInt(0);
		for (let i = str.length-1; i >= 0; i--) {
			num <<= B64_SHIFT;
			const val = B64_IDX[str[i]];
			num += BigInt(val);
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

	static random(states) {
		const n = Math.pow(states, 9);
		let array = []
		for (let i = 0; i < n; i++) {
			array[i] = Math.floor(Math.random() * states);
		}
		return new Rule(array);
	}
}

function getRuleSize(states) {
    return Math.ceil(Math.pow(states, 9) * Math.log(states)/Math.log(64));
}
