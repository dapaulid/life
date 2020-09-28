from rule import Rule

import np
from matplotlib import pyplot as plt

rule = Rule.load("life")
print(rule)
plt.matshow(rule.array[np.newaxis,:], aspect="auto")
plt.show()