import numpy as np
import scipy.ndimage as ndimage
import constants as c
from statistic import TimingStat

class World:
    def __init__(self, radius, rules):
        self.radius = radius
        self.rules = rules
        self.diameter = radius * 2 + 1
        self.tick_stat = TimingStat()
        self.reset()
    # end method

    def reset(self):
        # big bang initial conditions
        self.time = 0
        self.cells = np.zeros((self.diameter, self.diameter), dtype=int) # TODO type affects performace?
        self.cells[self.radius, self.radius] = 1
    # end method

    def tick(self):
        self.tick_stat.start()
        # TODO optimized convolve function?
        # http://blog.rtwilson.com/convolution-in-python-which-function-to-use/#:~:text=convolve%20is%20about%20twice%20as,convolve2d.&text=Using%20a%20random%208000%20x,a%20loop%20of%20various%20convolutions.
        indices = ndimage.convolve(self.cells, c.NEIGH, mode='wrap')
        self.cells = self.rules.take(indices)
        self.tick_stat.stop()
        self.time += 1
    # end method

    def advance(self, ticks):
        # execute specified number of ticks
        for i in range(ticks):
            self.tick()
        # end for
        # output statistics
        print("Tick %d: %s" % (self.time, self.tick_stat))
    # end method

# end class
