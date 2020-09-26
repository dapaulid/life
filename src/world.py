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
from compressor import Compressor
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
    def __init__(self, rule, radius=DEFAULT_RADIUS):
        self.radius = radius
        self.rule = rule
        self.diameter = radius * 2 + 1
        self.size = self.diameter**2
        self.reset()
    # end function

    #---------------------------------------------------------------------------
    ## resets the world to its initial state.
    def reset(self):
        # big bang initial conditions
        self.time = 0
        self.cells = np.zeros((self.diameter, self.diameter), dtype=int) # TODO type affects performace?
        self.cells[self.radius, self.radius] = 1
        # dictionary mapping hashes to ticks used for cycle detection
        self.hist = {}
        self.cycle_start = None
        self.cycle_period = None
        # statistics
        self.tick_stat = TimingStat()
        self.rule_count = np.zeros(self.rule.size, dtype=int)
        self.comp = Compressor(self)
    # end function

    #---------------------------------------------------------------------------
    ## returns true if the world is stable, i.e. the following states are cyclic
    def is_stable(self):
        return self.cycle_start is not None
    # end if

    #---------------------------------------------------------------------------
    ## advances the world to its next state.
    def tick(self):
        self.tick_stat.start()
        # apply the rule
        self.cells, idx = self.rule.apply(self.cells)
        # advance time
        self.time += 1
        # handle cycle detection
        if self.cycle_start is None:
            h = self.hash()
            self.cycle_start = self.hist.get(h)
            if self.cycle_start is not None:
                # cycle found!
                 self.cycle_period = self.time - self.cycle_start
            else:
                self.hist[h] = self.time
            # end if
        # end if
        # statistics: increment counter for those rules applied
        self.rule_count += np.bincount(idx.ravel(), 
            minlength=self.rule_count.size)
        self.comp.update()
        self.tick_stat.stop()
    # end function

    #---------------------------------------------------------------------------
    ## advances the world over multiple states.
    def advance(self, ticks):
        do_trace = not self.is_stable()
        # execute specified number of ticks
        while ticks > 0:
            self.tick()
            ticks -= 1
        # end if
        if do_trace:
            # output statistics
            print("Tick %d: took %s, total rules used: %0.2f%%, comp: %f, hash: %s" 
                % (self.time, self.tick_stat, self.get_total_rules_used()*100, self.comp.value, self.hash()))
            if self.is_stable():
                 print("World is stable after tick %d with period %d" 
                    % (self.cycle_start, self.cycle_period))                
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

    #---------------------------------------------------------------------------
    ## returns the total number of rules that have been applied so far. range: [0.0, 1.0]
    def get_total_rules_used(self):
        return np.count_nonzero(self.rule_count) / self.rule_count.size
    # end function

# end class

#-------------------------------------------------------------------------------
# end of file
