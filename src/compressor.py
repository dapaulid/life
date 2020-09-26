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
import zlib

#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class Compressor:

	#---------------------------------------------------------------------------
    ## constructor
	def __init__(self, world):
		self.world = world
		self.co = zlib.compressobj()
		self.value = None
	# end function

    #---------------------------------------------------------------------------
    ## returns a new rule with non-uniform distributed transitions
	def update(self):
		world_str = ("".join(map(str, self.world.cells.ravel()))).encode('utf-8')
		assert len(world_str) == self.world.size
		self.value = (len(self.co.compress(world_str)) + len(self.co.flush(zlib.Z_FULL_FLUSH))) / len(world_str)
	# end function

# end class

#-------------------------------------------------------------------------------
# end of file
