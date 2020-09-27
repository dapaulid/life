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
#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class Metric:

	#---------------------------------------------------------------------------
    ## constructor
    def __init__(self, world):
        self.world = world
        # initialize attributes with default values
        self.name = type(self).__name__
        self.value = None
        self.format = "%s"
	# end function

    def update(self):
        # subclasses can do something with self.world here
        pass
    # end function

    def __str__(self):
        return self.name + ": " + self.format % self.value
    # end function

# end class

#-------------------------------------------------------------------------------
# end of file
