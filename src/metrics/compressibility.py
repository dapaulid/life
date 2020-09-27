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
import zlib

#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class Compressibility(Metric):

	#---------------------------------------------------------------------------
    ## constructor
    def __init__(self, world):
        # call base
        Metric.__init__(self, world)
        self.name = "compressibility"
        self.value = 0.0
        self.format = "%.2f%%"
        self.co = zlib.compressobj()
	# end function

    def update(self):
        world_str = ("".join(map(str, self.world.cells.ravel()))).encode('utf-8')
        assert len(world_str) == self.world.size
        compressed_size = len(self.co.compress(world_str)) + len(self.co.flush(zlib.Z_FULL_FLUSH))
        self.value = (1.0 - compressed_size / len(world_str)) * 100
    # end function

# end class

#-------------------------------------------------------------------------------
# end of file
