import numpy as np
from statistic import TimingStat

class World:
    def __init__(self, radius, rule):
        self.radius = radius
        self.rule = rule
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
        self.rule_count = np.zeros(self.rule.size, dtype=int)
    # end function

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
        return np.count_nonzero(self.rule_count) / self.rule_count.size
    # end function

# end class
