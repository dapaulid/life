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
import matplotlib.pyplot as plt 
import matplotlib.animation as animation
import np

import sys

#-------------------------------------------------------------------------------
# class definition
#-------------------------------------------------------------------------------
#
class Plot:

    #---------------------------------------------------------------------------
    ## constructor
    def __init__(self):
        self.world = None
        self.mat = None
        self.ani = None
        self.paused = False
    # end function

    #---------------------------------------------------------------------------
    ## called by FuncAnimation to update the plots
    def update(self, data):
        self.mat.set_data(np.asnumpy(data))
        # return all actors that needs to be redrawn
        return self.mat
    # end function 

    #---------------------------------------------------------------------------
    ## called by FuncAnimation to generate more frames to plot
    def data_gen(self):
        while True:
            self.world.advance(1)
            yield self.world.cells
        # end while
    # end function

    #---------------------------------------------------------------------------
    ## displays the plot in a separate window
    def show(self, world):
        self.world = world
        fig, ax = plt.subplots()#(2, 1, gridspec_kw={'height_ratios': [4, 2]})
        fig.canvas.set_window_title('Live')
        self.mat = ax.matshow(np.asnumpy(self.world.cells))
        self.ani = animation.FuncAnimation(fig, self.update, self.data_gen, 
            interval=10, blit=False)
        # do not block in interactive mode (python -i)
        plt.show(block=not sys.flags.interactive)
    # end function

    #---------------------------------------------------------------------------
    ## pauses/resumes the animation
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

#-------------------------------------------------------------------------------
# end of file
