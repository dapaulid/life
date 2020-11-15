shaders["ca2d-frag"] = glsl`
//------------------------------------------------------------------------------
/**
 * @license
 * Copyright (c) Daniel Pauli <dapaulid@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
//------------------------------------------------------------------------------
precision mediump float;

//------------------------------------------------------------------------------
// macros
//------------------------------------------------------------------------------
//
// set this to 1 for debugging
#define DEBUG 0

#define NEIGH_SIZE 9
#define MAX_LABELS 8

// returns the logical state of a cell pixel
//#define CELL_STATE(cell)      int(0.5 + cell.g)
#define CELL_STATE(cell)      int(GET_CELL_DATA(cell)[0])
// returns the label (color index) of a cell pixel
#define CELL_LABEL(cell)      2//int(0.5 + mod(cell.b, float(MAX_LABELS)))

#define GET_CELL_DATA(cell)   floor(mod(cell.aa * vec2(256.0, 8.0), vec2(32.0, 8.0)))

// return a vec4 from an array represented as "pseudo" 1D texture
#define LOOKUP(u2d, i, n)     texture2D(u2d, vec2((float(i) + 0.5) / float(n), 0.5))

// ternary operator for vectors, potentially faster for simple values than branching
#define VEC_TERN(cond, then_val, else_val)   mix(else_val, then_val, float(cond))

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
uniform vec2        u_neighCoord [NEIGH_SIZE];
uniform vec4        u_labelColors [MAX_LABELS];

//------------------------------------------------------------------------------
// constants
//------------------------------------------------------------------------------
//
const vec4 error        = vec4(1.0, 0.0, 1.0, 1.0); // fuchsia


//------------------------------------------------------------------------------
// main
//------------------------------------------------------------------------------
//
void main() {

	vec4 cell = texture2D(u_world, v_cellCoord);
	if (!u_tick) {
		// render only
		// filter alpha channel which is used to hold state info
		RETURN(vec4(cell.rgb, 1.0));
	}

	// index into rule array
	highp int idx = 0;
	// array for determining the most frequent label
	lowp int labelCount [MAX_LABELS];

	// iterate over cells in neighborhood (including center)
	for (int i = NEIGH_SIZE - 1; i >= 0; i--) {
		vec4 neigh = texture2D(u_world, v_cellCoord + u_neighCoord[i]);
		
		vec2 data = GET_CELL_DATA(neigh);
		int state = int(data[0]);
		int label = int(data[1]);

		// add state to rule index
		idx = idx*u_states + state;

		// increment count for label
		for (int l = 0; l < MAX_LABELS; l++) {
			// TODO replace branch with mix?
			if (l == label) {
				labelCount[l]++;
			} // end if
		} // end for
	} // end for

	// determine most frequent label (mode)
	vec4 modeColor = u_labelColors[0];
	lowp int modeCount = 0; // to select label 0 only if no others
	for (int l = 1; l < MAX_LABELS; l++) {
		// TODO replace branch with mix?
		if (labelCount[l] > modeCount) {
			modeColor = u_labelColors[l];
			modeCount = labelCount[l];
		} // end if
	} // end for

#if DEBUG
	// sanity checks
	if ((idx < 0) || (idx >= 512)) {
		RETURN(error);
	}
	if ((modeLabel < 0) || (modeLabel >= MAX_LABELS)) {
		RETURN(error);
	}
#endif

	// determine new cell
	vec4 newCell = LOOKUP(u_rule, idx, u_ruleSize);
	lowp int newState = CELL_STATE(newCell);

	// handle fading
	if (u_fade) {
		lowp int oldState = CELL_STATE(cell);
		if (newState == 0) {
			// handle fade out
			if (oldState == 1) {
				// just died
				RETURN(vec4(cell.rgb * 0.5, 0.0)); 
			} else {
				// fade out
				RETURN(vec4(cell.rgb * 0.97, 0.0));
			}
		}
	}

	// apply label for alive cells
	// TODO use VEC_TERN?
	if (newState != 0) {
		newCell = vec4(newCell.rgb * modeColor.rgb, newCell.a + modeColor.a);
	}

	RETURN(newCell);
}

`; // end fragment shader
//------------------------------------------------------------------------------
// end of file
