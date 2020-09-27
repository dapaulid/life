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
from metric import Metric
import np

#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class Exploration(Metric):

	#---------------------------------------------------------------------------
    ## constructor
    def __init__(self, world):
        # call base
        Metric.__init__(self, world)
        self.name = "exploration"
        self.value = 0.0
        self.format = "%.2f%%"
        # dictionary mapping hashes to ticks used for cycle detection
        self.rule_count = np.zeros(self.world.rule.size, dtype=int)
	# end function

    def update(self):
        # increment counter for those transition applied in last tick
        self.rule_count += np.bincount(self.world.trans_idx.ravel(), 
            minlength=self.rule_count.size)
        ## determine total number of transitions that have been applied so far (percent)
        self.value = np.count_nonzero(self.rule_count) / self.rule_count.size * 100
    # end function

# end class

#-------------------------------------------------------------------------------
# end of file
