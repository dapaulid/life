# -*- coding: utf-8 -*-
#-------------------------------------------------------------------------------
"""
    @license
    Copyright (c) Daniel Pauli <dapaulid@gmail.com>

    This source code is licensed under the MIT license found in the
    LICENSE file in the root directory of this source tree.
"""
#-------------------------------------------------------------------------------

#-------------------------------------------------------------------------------
# imports
#-------------------------------------------------------------------------------
#
import np
import json
import os
import functools
import math

#-------------------------------------------------------------------------------
# constants
#-------------------------------------------------------------------------------
#
## convolution kernel used to determine index into rule array for each cell neighborhood
NEIGH_KERNEL = np.array(
   [[4, 3, 2],
    [5, 0, 1],
    [6, 7, 8]]
)


## the base64 alphabet used for rule encoding. 
## it is chosen to be URL friendly and maintain 0 for zero bits. 
B64_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-"
B64_IDX = {}
for i in range(len(B64_CHARS)):
	B64_IDX[B64_CHARS[i]] = i
# end for
B64_MASK  = 0x3F
B64_SHIFT = 6

#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class Rule:

	@staticmethod
	def get_array_size(states):
		return states ** NEIGH_KERNEL.size
	# end function

	#---------------------------------------------------------------------------
    ## constructor
	def __init__(self, array):
		self.states = int(len(array) ** (1.0/NEIGH_KERNEL.size))
		self.size = Rule.get_array_size(self.states)
		self.array = np.array(array)
		self.kernel = np.power(self.states, NEIGH_KERNEL)
	# end function

    #---------------------------------------------------------------------------
    ## applies this rule to the given two-dimensional array
	def apply(self, cells):
		# TODO optimized convolve function?
		# http://blog.rtwilson.com/convolution-in-python-which-function-to-use/#:~:text=convolve%20is%20about%20twice%20as,convolve2d.&text=Using%20a%20random%208000%20x,a%20loop%20of%20various%20convolutions.
		idx = np.convolve(cells, self.kernel, mode='wrap')
		# determine next state by applying the rules
		new_cells = self.array[idx] # same as self.arr.take(idx), but seems faster
		return new_cells, idx
	# end function

    #---------------------------------------------------------------------------
    ## returns the string representation (base64) of this rule
	def encode(self):
		encoded = ""
		num = functools.reduce(lambda acc, x: acc * self.states + int(x), self.array[::-1], 0)
		for i in range(Rule.get_base64_size(self.states)):
			encoded += B64_CHARS[num & B64_MASK]
			num >>= B64_SHIFT
		# end for
		return encoded		
	# end function

	@staticmethod
	def decode(str):
		# determine number of states
		states = None
		for i in range(2, 256):
			if Rule.get_base64_size(i) == len(str):
				states = i
				break
			# end if
		# end if
		num = 0
		for c in str[::-1]:
			num <<= B64_SHIFT
			num += B64_IDX[c]
		# end for
		n = states ** 9
		array = [None] * n
		for i in range(n):
			array[i] = num % states
			num //= states
		# end for
		print(array)
		return Rule(array)
	# end function	

	def get_count(self):
		return np.bincount(self.array, minlength=self.states) / self.size	
	# end function

	def __str__(self):
		# TODO output base64 representation?
		return "(" + ", ".join(["%.3f" % x for x in self.get_count()]) + ")"
	# end function

    #---------------------------------------------------------------------------
    ## returns the file name of the rule file
	@staticmethod
	def get_rule_file(name):
		return os.path.join("data/rules", name + ".json")
	# end function

    #---------------------------------------------------------------------------
    ## saves the rule with the given name
	def save(self, name):
		state = {
			'array': self.array.tolist()
		}
		with open(Rule.get_rule_file(name), 'w') as f:
			json.dump(state, f)
		# end with
	# end function

    #---------------------------------------------------------------------------
    ## loads the rule with the given name
	@staticmethod
	def load(name):
		with open(Rule.get_rule_file(name), 'r') as f:
			state = json.load(f)
		# end with
		return Rule(state['array'])
	# end function

    #---------------------------------------------------------------------------
    ## constructs a rule from a given (big) integer
	@staticmethod
	def from_int(value, states):
		n = Rule.get_array_size(states)
		array = [0] * n
		for i in range(n):
			array[i] = value % states
			value //= states
		# end for
		return Rule(array)
	# end function	

	@staticmethod
	def get_base64_size(states):
		return math.ceil(states**9 * math.log(states)/math.log(64))
	# end function

# end class

#-------------------------------------------------------------------------------
# end of file
