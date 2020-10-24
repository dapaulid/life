
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

const NEIGH_SIZE = 9; // size of a 3x3 Moore neighborhood including center

class Rule {

	constructor(array) {
		this.array = array;
		this.states = Math.pow(this.array.length, 1/NEIGH_SIZE);
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
		const n = Math.pow(states, NEIGH_SIZE);
		let array = [];
		for (let i = 0; i < n; i++) {
			array[n-i-1] = Number(num % radix);
			num /= radix;
		}
		return new Rule(array);
	
	}

	static random(states) {
		if (states != 2) {
			throw Error("Only 2 states supported so far");
		}
		const n = states**NEIGH_SIZE;
		const t = Math.random();
		let array = []
		for (let i = 0; i < n; i++) {
			array[i] = Math.random() <= t ? 0 : 1;
		}
		return new Rule(array);
	}

	static generate(states, func) {
		let array = []
		let neigh = zeros(NEIGH_SIZE+1); // add one for sentinel
		while (!neigh[NEIGH_SIZE]) {

			// determine state of center cell
			let cell = neigh[0];
			
			// count cells for each states
			// start from 1 to exclude center
			let counts = zeros(states);
			for (let i = 1; i < NEIGH_SIZE; i++) {
				counts[neigh[i]]++;
			}

			// determine transition for this configuration
			let next_cell = func(cell, counts);
			if (!Number.isInteger(next_cell)) {
				throw TypeError("returned state must be an integer");
			}
			if ((next_cell < 0) || (next_cell >= states)) {
				throw RangeError("returned state must be between 0 and " + (states-1));
			}
			array.push(next_cell);

			// increment with overflow
			for (let i = 0; i <= NEIGH_SIZE; i++) {
				neigh[i] = (neigh[i] + 1) % states;
				if (neigh[i] != 0) {
					break;
				}
			}
		}
		return new Rule(array);
	}

	get length() {
		return this.array.length;
	}
}

function getRuleSize(states) {
    return Math.ceil(Math.pow(states, 9) * Math.log(states)/Math.log(64));
}

function zeros(n) {
	return new Array(n).fill(0);
}