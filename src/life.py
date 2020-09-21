#!/usr/bin/env python

import numpy as np
from world import World
from plot import Plot
from rule import Rule

from multiprocessing import Pool

rule = Rule.load("spiral")
world = World(100, rule)

plot = Plot()
plot.show(world)

"""
def f(x):
    rules = np.random.randint(2, size=512)
    world = World(100, rules)
    world.advance(1000)
    return world.time

# with Pool(2) as p: # TODO requires python3?
p = Pool()
print(p.map(f, [1] * 10))
p.terminate()
# end with
"""