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

#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class Cyclic(Metric):

	#---------------------------------------------------------------------------
    ## constructor
    def __init__(self, world):
        # call base
        Metric.__init__(self, world)
        self.name = "cyclic"
        self.value = False
        # dictionary mapping hashes to ticks used for cycle detection
        self.hist = {}
        self.cycle_start = None
        self.cycle_period = None        
	# end function

    def update(self):
        # handle cycle detection
        if not self.value:
            h = self.world.hash()
            self.cycle_start = self.hist.get(h)
            if self.cycle_start is not None:
                # cycle found!
                 self.cycle_period = self.world.time - self.cycle_start
                 self.value = True
            else:
                self.hist[h] = self.world.time
            # end if
        # end if
    # end function

# end class

#-------------------------------------------------------------------------------
# end of file
