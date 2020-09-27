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
class Population(Metric):

	#---------------------------------------------------------------------------
    ## constructor
    def __init__(self, world):
        # call base
        Metric.__init__(self, world)
        self.name = "population"
        self.value = self.world.get_population()
	# end function

    def update(self):
        self.value = self.world.get_population()
    # end function

# end class

#-------------------------------------------------------------------------------
# end of file
