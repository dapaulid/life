'use strict';

class SortedArray {
	constructor() {
		this.array = null;
		this.clear();
	}

	clear() {
		this.array = [];
	}

	add(value) {
		if ((this.array.length == 0) || (value >= this.last)) {
			// optimize for frequent case (append in order)
			this.array.push(value);
		} else {
			// insert in order
			let i = this.lowerBound(value);
			this.array.splice(i, 0, value);
		}
	}

	remove(value) {
		const index = this.indexOf(value);
		if (index < 0) {
			return false;
		}
		this.array.splice(index, 1);
		return true;
	}

	get(index) {
		return this.array[index];
	}

	indexOf(value) {
		const l = this.lowerBound(value);
		return this.array[l] === value ? l : -1;
	}

	has(value) {
		return this.indexOf(value) >= 0;
	}

	lowerBound(value) {
		let l = 0;
		let u = this.array.length;
		while (l < u) {
			let m = (l + u) >> 1;
			if (value <= this.array[m]) {
				u = m;
			} else {
				l = m+1;
			}
		}
		return l;
	}

	get first() {
		return this.array[0];
	}

	get last() {
		return this.array[this.array.length-1];
	}

	get length() {
		return this.array.length;
	}

	toString() {
		return this.array.toString();
	}
}