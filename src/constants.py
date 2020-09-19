import numpy as np

STATES = 2
NEIGH = np.power(STATES, 
   [[4, 3, 2],
    [5, 0, 1],
    [6, 7, 8]]
)
RULE_COUNT = STATES ** NEIGH.size
