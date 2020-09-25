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
from rule import Rule

#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class RuleGenerator:

	#---------------------------------------------------------------------------
    ## constructor
	def __init__(self, states, seed=None):
		self.states = states
		self.rng = np.random.default_rng(seed)
	# end function


    #---------------------------------------------------------------------------
    ## returns a new rule with non-uniform distributed transitions
	def random(self):
		n = Rule.get_array_size(self.states)
		dist = self.rng.random(self.states)
		dist /= sum(dist)
		return Rule(self.rng.choice(self.states, n, p=dist))
	# end function

# end class

#-------------------------------------------------------------------------------
# end of file
