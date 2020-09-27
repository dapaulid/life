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

# metrics we want to apply to our world
from metrics.cyclic import Cyclic
from metrics.exploration import Exploration
from metrics.compressibility import Compressibility
from metrics.population import Population

#-------------------------------------------------------------------------------
# main
#-------------------------------------------------------------------------------
#

# create some random rule
geni = RuleGenerator(2)
rule = geni.random()
# avoid "flicker-worlds"
rule.array[0] = 0
rule.save("last_random")

#rule = Rule.load("hourglass")

# create a world governed by this rule
world = World(rule, 
    radius=50, 
    metrics=[Exploration, Compressibility, Population, Cyclic]
)

# display the world over time
plot = Plot()
plot.show(world)

#-------------------------------------------------------------------------------
# end of file
