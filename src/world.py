import numpy as np
import scipy.ndimage as ndimage
import constants as c
from statistic import TimingStat

class World:
    def __init__(self, radius, rules):
        self.radius = radius
        self.rules = rules
        self.diameter = radius * 2 + 1
        self.reset()
    # end function

    def reset(self):
        # big bang initial conditions
        self.time = 0
        self.cells = np.zeros((self.diameter, self.diameter), dtype=int) # TODO type affects performace?
        self.cells[self.radius, self.radius] = 1
        # statistics
        self.tick_stat = TimingStat()
        self.rules_count = np.zeros(self.rules.size, dtype=int)
    # end function

    def tick(self):
        self.tick_stat.start()
        # TODO optimized convolve function?
        # http://blog.rtwilson.com/convolution-in-python-which-function-to-use/#:~:text=convolve%20is%20about%20twice%20as,convolve2d.&text=Using%20a%20random%208000%20x,a%20loop%20of%20various%20convolutions.
        idx = ndimage.convolve(self.cells, c.NEIGH, 
            mode='wrap')
        # determine next state by applying the rules
        self.cells = self.rules[idx] # same as self.rules.take(idx), but seems faster
        # statistics: increment counter for those rules applied
        self.rules_count += np.bincount(idx.flatten(), 
            minlength=self.rules_count.size)
        self.tick_stat.stop()
        self.time += 1
    # end function

    def advance(self, ticks):
        # execute specified number of ticks
        for _ in range(ticks):
            self.tick()
        # end for
        # output statistics
        print("Tick %d: took %s, total rules used: %0.2f%%" % (self.time, self.tick_stat, self.get_total_rules_used()*100))
    # end function

    def get_population(self):
        return np.unique(self.cells, return_counts=True)[1] / self.cells.size
    # end function

    def get_total_rules_used(self):
        return np.count_nonzero(self.rules_count) / self.rules_count.size
    # end function

# end class
