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

from multiprocessing import Pool

#-------------------------------------------------------------------------------
# main
#-------------------------------------------------------------------------------
#

geni = RuleGenerator(2)
rule = geni.random()
# avoid "flicker-worlds"
rule.array[0] = 0
rule.save("last_random")

rule = Rule.load("breaking_lines")
world = World(rule, 100)

#world.advance(12600)

plot = Plot()
plot.show(world)

#-------------------------------------------------------------------------------
# end of file
