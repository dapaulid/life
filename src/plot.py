import matplotlib.pyplot as plt 
import matplotlib.animation as animation

import sys

x = []
y = []

class Plot:

    def __init__(self):
        self.world = None
        self.mat = None
        self.ani = None
        self.paused = False
    # end function

    def update(self, data):
        self.mat.set_data(data)
        #x.append(world.time)
        #y.append(world.get_population()[1])
        #line.set_data(x, y)
        #fig.gca().relim()
        #fig.gca().autoscale_view()    
        #line.axes.axis([0, 10, 0, 1])
        #ax[1].plot(world.time,world.get_population()[1],'.',color='black')
        ##line, = ax[1].plot(x,y)
        #p = ax[1].fill_between(x, y, color='#539ecd')
        return self.mat#, line, p
    # end function 

    def data_gen(self):
        while True:
            self.world.advance(1)
            yield self.world.cells
        # end while
    # end function

    def show(self, world):
        self.world = world
        fig, ax = plt.subplots()#(2, 1, gridspec_kw={'height_ratios': [4, 2]})
        fig.canvas.set_window_title('Live')
        #fig.gca().grid()
        self.mat = ax.matshow(self.world.cells)
        #line, = ax[1].plot(x,y,color='k')
        #plt.colorbar(mat)
        self.ani = animation.FuncAnimation(fig, self.update, self.data_gen, 
            interval=10, blit=False)
        #ax[1].set_ylim([0.0,1.0])

        # do not block in interactive mode (python -i)
        plt.show(block=not sys.flags.interactive)
    # end function

    def pause(self):
        if self.paused:
            self.ani.event_source.start()
            self.paused = False
        else:
            self.ani.event_source.stop()
            self.paused = True
        # end if
    # end function

# end class