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
# constants
#-------------------------------------------------------------------------------
#
STRUCTURE = np.array(
    [[1,1,1],
     [1,1,1],
     [1,1,1]]
)

#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class Patterns(Metric):

	#---------------------------------------------------------------------------
    ## constructor
    def __init__(self, world):
        # call base
        Metric.__init__(self, world)
        self.name = "patterns"
        self.value = 0
	# end function

    def update(self):
        # TODO properly handle background color
        _, self.value = np.label(1 - self.world.cells, STRUCTURE)
    # end function

# end class

#-------------------------------------------------------------------------------
# end of file
