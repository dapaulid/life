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
import sys

"""
    This is a wrapper module that allows to switch between 
    the conventional numpy/scipy and the CUDA accelerated cupy
    while maintaining the same API for client code.
"""
if '--cuda' in sys.argv:
    # use cupy
    from cupy import *
    from cupyx.scipy.ndimage import convolve
else:
    # use numpy/scipy    
    from numpy import *
    from scipy.ndimage import convolve, label
    # dummy cupy.asnumpy replacement
    def asnumpy(a, stream=None): return a
# end if

#-------------------------------------------------------------------------------
# end of file
