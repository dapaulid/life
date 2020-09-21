import numpy as np
import scipy.ndimage as ndimage
import json
import os

# convolution kernel used to determine index into rule array for each cell neighborhood
NEIGH_KERNEL = np.array(
   [[4, 3, 2],
    [5, 0, 1],
    [6, 7, 8]]
)

class Rule:
	def __init__(self, array_or_states):
		if np.isscalar(array_or_states):
			self.states = array_or_states
			self.size = self.states**NEIGH_KERNEL.size
			self.array = np.random.randint(self.states, size=self.size)
		else:
			self.states = int(len(array_or_states) ** (1.0/NEIGH_KERNEL.size))
			self.size = self.states**NEIGH_KERNEL.size
			self.array = np.array(array_or_states)
		# end if
		self.kernel = np.power(self.states, NEIGH_KERNEL)
	# end function

	def apply(self, cells):
		# TODO optimized convolve function?
		# http://blog.rtwilson.com/convolution-in-python-which-function-to-use/#:~:text=convolve%20is%20about%20twice%20as,convolve2d.&text=Using%20a%20random%208000%20x,a%20loop%20of%20various%20convolutions.
		idx = ndimage.convolve(cells, self.kernel, mode='wrap')
		# determine next state by applying the rules
		new_cells = self.array[idx] # same as self.arr.take(idx), but seems faster
		return new_cells, idx
	# end function

	@staticmethod
	def get_rule_file(name):
		return os.path.join("data/rules", name + ".json")
	# end function

	def save(self, name):
		state = {
			'array': self.array.tolist()
		}
		with open(Rule.get_rule_file(name), 'w') as f:
			json.dump(state, f)
		# end with
	# end function

	@staticmethod
	def load(name):
		with open(Rule.get_rule_file(name), 'r') as f:
			state = json.load(f)
		# end with
		return Rule(state['array'])
	# end function

# end class