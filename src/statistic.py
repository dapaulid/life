class Stat:
    def __init__(self):
        self.reset()
    # end function
    
    def reset(self):
        self.last = None
        self.count = 0
        self.sum = 0
        self.min = None
        self.max = None
    # end function

    def update(self, x):
        self.last = x
        self.count += 1
        self.sum += x
        self.min = min(self.min, x) if self.min != None else x
        self.max = max(self.max, x) if self.max != None else x        
    # end function

    def __str__(self):
        return "%.3f (avg=%.3f, min=%.3f, max=%.3f)" % (self.last, self.sum / self.count, self.min, self.max)
    # end function

# end class

from timeit import default_timer as timer

class TimingStat(Stat):
    def __init__(self):
        Stat.__init__(self)
        self.start_time = None
    # end function

    def now(self):
        return timer() * 1000 # [s] -> [ms]
    # end function

    def start(self):
        self.start_time = self.now()
    # end function

    def stop(self):
        self.update(self.now() - self.start_time)
    # end function

# end class 
