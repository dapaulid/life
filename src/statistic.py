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
from timeit import default_timer as timer

#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class Stat:

	#---------------------------------------------------------------------------
    ## constructor    
    def __init__(self):
        self.reset()
    # end function
    
    #---------------------------------------------------------------------------
    ## resets the statistics to its initial state
    def reset(self):
        self.last = None
        self.count = 0
        self.sum = 0
        self.min = None
        self.max = None
    # end function

	#---------------------------------------------------------------------------
    ## updates the statistics with the given sample
    def update(self, x):
        self.last = x
        self.count += 1
        self.sum += x
        self.min = min(self.min, x) if self.min != None else x
        self.max = max(self.max, x) if self.max != None else x        
    # end function

	#---------------------------------------------------------------------------
    ## return string representation 
    def __str__(self):
        return "%.3f (avg=%.3f, min=%.3f, max=%.3f)" % (self.last, self.sum / self.count, self.min, self.max)
    # end function

# end class


#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class TimingStat(Stat):

	#---------------------------------------------------------------------------
    ## constructor    
    def __init__(self):
        Stat.__init__(self)
        self.start_time = None
    # end function

	#---------------------------------------------------------------------------
    ## returns the current time stamp in milliseconds
    def now(self):
        return timer() * 1000 # [s] -> [ms]
    # end function

	#---------------------------------------------------------------------------
    ## starts measuring execution time   
    def start(self):
        self.start_time = self.now()
    # end function

	#---------------------------------------------------------------------------
    ## stops measuring execution time   
    def stop(self):
        self.update(self.now() - self.start_time)
    # end function

# end class 

#-------------------------------------------------------------------------------
# end of file
