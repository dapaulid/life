#!/usr/bin/env python
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
from world import World
from plot import Plot
from rule import Rule
from rule_gen import RuleGenerator
from compressor import Compressor
import sys

# metrics we want to apply to our world
from metrics.cyclic import Cyclic
from metrics.exploration import Exploration
from metrics.compressibility import Compressibility
from metrics.population import Population
from metrics.patterns import Patterns

#-------------------------------------------------------------------------------
# main
#-------------------------------------------------------------------------------
#

# create some random rule
geni = RuleGenerator(2)
while True:
    rule = geni.random()
    # avoid "flicker-worlds"
    rule.array[0] = 0

    world = World(rule, radius=64, metrics=[Patterns])
    world.advance(64*2)
    sys.stdout.write(".")
    sys.stdout.flush()
    pop = world.get_population()
    if pop[0] > 0.01 and pop[0] < 0.1 and world.metrics[0].value < 100:
        break
# end while
rule.save("last_random")

#rule = Rule.load("life")
#rule = geni.random()

# create a world governed by this rule
world = World(rule, 
    radius=64, 
    metrics=[Exploration, Compressibility, Population, Patterns, Cyclic]
)

#world.advance(200000)

# display the world over time
plot = Plot()
plot.show(world)
print(rule.encode())

#-------------------------------------------------------------------------------
# end of file
