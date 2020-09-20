import numpy as np
from world import World
import constants as c

import matplotlib.pyplot as plt 
import matplotlib.animation as animation

#rules = np.zeros(c.RULE_COUNT, dtype=int)
#rules[2] = 1

rules = np.array(
    [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
)

rules = np.random.randint(2, size=512)

world = World(100, rules)

x = []
y = []


def update(data):
    mat.set_data(data)
    #x.append(world.time)
    #y.append(world.get_population()[1])
    #line.set_data(x, y)
    #fig.gca().relim()
    #fig.gca().autoscale_view()    
    #line.axes.axis([0, 10, 0, 1])
    #ax[1].plot(world.time,world.get_population()[1],'.',color='black')
    ##line, = ax[1].plot(x,y)
    #p = ax[1].fill_between(x, y, color='#539ecd')
    return mat#, line, p
# end function 

def data_gen():
    while True:
        world.advance(1)
        yield world.cells
    # end while
# end function

fig, ax = plt.subplots()#(2, 1, gridspec_kw={'height_ratios': [4, 2]})
fig.canvas.set_window_title('Live')
#fig.gca().grid()
mat = ax.matshow(world.cells)
#line, = ax[1].plot(x,y,color='k')
#plt.colorbar(mat)
ani = animation.FuncAnimation(fig, update, data_gen, 
    interval=10, blit=False)
#ax[1].set_ylim([0.0,1.0])

plt.show()