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
import numpy as np
from statistic import TimingStat

#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class World:
    #---------------------------------------------------------------------------
    # constants
    #---------------------------------------------------------------------------
    #
    ## default world radius if ommitted in constructor
    DEFAULT_RADIUS = 100

    #---------------------------------------------------------------------------
    # functions
    #---------------------------------------------------------------------------
    #
    #---------------------------------------------------------------------------
    ## constructor
    def __init__(self, rule, radius=DEFAULT_RADIUS):
        self.radius = radius
        self.rule = rule
        self.diameter = radius * 2 + 1
        self.reset()
    # end function

    #---------------------------------------------------------------------------
    ## resets the world to its initial state.
    def reset(self):
        # big bang initial conditions
        self.time = 0
        self.cells = np.zeros((self.diameter, self.diameter), dtype=int) # TODO type affects performace?
        self.cells[self.radius, self.radius] = 1
        # statistics
        self.tick_stat = TimingStat()
        self.rule_count = np.zeros(self.rule.size, dtype=int)
    # end function

    #---------------------------------------------------------------------------
    ## advances the world to its next state.
    def tick(self):
        self.tick_stat.start()
        # apply the rule
        self.cells, idx = self.rule.apply(self.cells)
        # statistics: increment counter for those rules applied
        self.rule_count += np.bincount(idx.flatten(), 
            minlength=self.rule_count.size)
        self.tick_stat.stop()
        self.time += 1
    # end function

    #---------------------------------------------------------------------------
    ## advances the world over multiple states.
    def advance(self, ticks):
        # execute specified number of ticks
        for _ in range(ticks):
            self.tick()
        # end for
        # output statistics
        print("Tick %d: took %s, total rules used: %0.2f%%" % (self.time, self.tick_stat, self.get_total_rules_used()*100))
    # end function

    #---------------------------------------------------------------------------
    ## returns the current number of cells of each state
    def get_population(self):
        return np.unique(self.cells, return_counts=True)[1] / self.cells.size
    # end function

    #---------------------------------------------------------------------------
    ## returns the total number of rules that have been applied so far. range: [0.0, 1.0]
    def get_total_rules_used(self):
        return np.count_nonzero(self.rule_count) / self.rule_count.size
    # end function

# end class

#-------------------------------------------------------------------------------
# end of file
