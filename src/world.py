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
import np
from statistic import TimingStat
import sys

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
    def __init__(self, rule, radius=DEFAULT_RADIUS, metrics=[]):
        self.radius = radius
        self.rule = rule
        self.diameter = radius * 2 + 1
        self.size = self.diameter**2
        self.reset()
        self.metrics = [Metric(self) for Metric in metrics]
    # end function

    #---------------------------------------------------------------------------
    ## resets the world to its initial state.
    def reset(self):
        # big bang initial conditions
        self.time = 0
        self.cells = np.zeros((self.diameter, self.diameter), dtype=int) # TODO type affects performace?
        self.cells[self.radius, self.radius] = 1
        # matrix with indices into rule array of last tick
        self.trans_idx = None
        # statistics
        self.tick_stat = TimingStat()
    # end function

    #---------------------------------------------------------------------------
    ## advances the world to its next state.
    def tick(self):
        self.tick_stat.start()
        # apply the rule
        self.cells, self.trans_idx = self.rule.apply(self.cells)
        # advance time
        self.time += 1
        self.tick_stat.stop()
    # end function

    #---------------------------------------------------------------------------
    ## advances the world over multiple states.
    def advance(self, ticks=1, silent=False):
        # execute specified number of ticks
        while ticks > 0:
            self.tick()
            ticks -= 1
            # periodically update status
            if self.time % 1000 == 0 or ticks == 0:
                # calculate metrics
                for m in self.metrics:
                    m.update()
                # output status
                if not silent:
                    print(self)
                # end if
            # end if
        # end if
    # end function

    # get hash of the current cell configuration
    def hash(self):
        h = hash(self.cells.tostring())
        # ensure h is nonnegative
        h %= (sys.maxsize + 1) * 2
        return "%016x" % h
    # end function

    #---------------------------------------------------------------------------
    ## returns the current number of cells of each state
    def get_population(self):
        return np.unique(self.cells, return_counts=True)[1] / self.cells.size
    # end function

    def __str__(self):
        return ("[tick %d] " % self.time) + ", ".join(map(str, self.metrics))
    # end function

# end class

#-------------------------------------------------------------------------------
# end of file
