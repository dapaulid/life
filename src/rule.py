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

# end class

#-------------------------------------------------------------------------------
# end of file
