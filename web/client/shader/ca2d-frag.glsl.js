//------------------------------------------------------------------------------
/**
 * @license
 * Copyright (c) Daniel Pauli <dapaulid@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
//------------------------------------------------------------------------------
shaders["ca2d-frag"] = glsl` // fragment shader
//------------------------------------------------------------------------------
//
precision mediump float;

//------------------------------------------------------------------------------
// macros
//------------------------------------------------------------------------------
//
// set this to 1 for debugging
#define DEBUG 0

// returns the logical state of a cell pixel
#define CELL_STATE(cell)      int(0.5 + cell.g)
// returns the new cell color
#define RETURN(color)         gl_FragColor = color; return;

//------------------------------------------------------------------------------
// varyings
//------------------------------------------------------------------------------
//
varying vec2        v_cellCoord;

//------------------------------------------------------------------------------
// uniforms
//------------------------------------------------------------------------------
//
uniform sampler2D   u_world;
uniform vec2        u_worldSize;
uniform sampler2D   u_rule;
uniform highp int   u_ruleSize;
uniform lowp  int   u_states;
uniform bool        u_tick;
uniform bool        u_fade;

//------------------------------------------------------------------------------
// constants
//------------------------------------------------------------------------------
//
vec4 error        = vec4(0.5, 0.0, 0.5, 1.0); // purple

//------------------------------------------------------------------------------
// main
//------------------------------------------------------------------------------
//
void main() {

	vec4 cell = texture2D(u_world, v_cellCoord);
	if (!u_tick) {
		// render only
		RETURN(cell);
	}

	lowp int oldState = CELL_STATE(cell);
	vec2 px = vec2(1.0, 1.0)/u_worldSize;

	/*
		determine index into rule array using convolution with exponential weights:

			 4 | 3 | 2
			---+---+---
			 5 | 0 | 1
			---+---+---
			 6 | 7 | 8

		hint: read the following statements backwards for correct order
	*/
	highp int idx      = CELL_STATE(texture2D(u_world, v_cellCoord + vec2( 1.0, -1.0)*px));
	idx = idx*u_states + CELL_STATE(texture2D(u_world, v_cellCoord + vec2( 0.0, -1.0)*px));
	idx = idx*u_states + CELL_STATE(texture2D(u_world, v_cellCoord + vec2(-1.0, -1.0)*px));
	idx = idx*u_states + CELL_STATE(texture2D(u_world, v_cellCoord + vec2(-1.0,  0.0)*px));
	idx = idx*u_states + CELL_STATE(texture2D(u_world, v_cellCoord + vec2(-1.0,  1.0)*px));
	idx = idx*u_states + CELL_STATE(texture2D(u_world, v_cellCoord + vec2( 0.0,  1.0)*px));
	idx = idx*u_states + CELL_STATE(texture2D(u_world, v_cellCoord + vec2( 1.0,  1.0)*px));
	idx = idx*u_states + CELL_STATE(texture2D(u_world, v_cellCoord + vec2( 1.0,  0.0)*px));
	idx = idx*u_states + oldState;

#if DEBUG
	// sanity check
	if (idx < 0 || idx > 511) {
		RETURN(error);
	}
#endif

	vec4 newCell = texture2D(u_rule, vec2((float(idx) + 0.5) / float(u_ruleSize), 0.5));

	// handle fading
	if (u_fade) {
		lowp int newState = CELL_STATE(newCell);
		if (newState == 0) {
			// handle fade out
			if (oldState == 1) {
				// just died
				RETURN(vec4(0.0, 0.0, 1.0, 1.0)); // blue
			} else if (cell.b > 0.0) {
				// fade out
				RETURN(vec4(0.0, 0.0, max(cell.b - 0.004, 0.25), 1.0));
			}
		}
	}

	RETURN(newCell);
}

`; // end fragment shader
//------------------------------------------------------------------------------
// end of file
