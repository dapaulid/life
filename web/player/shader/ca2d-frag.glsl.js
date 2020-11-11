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
#define CELL_STATE(cell)      int(0.5 + cell.g)
// returns the label (color index) of a cell pixel
#define CELL_LABEL(cell)      int(0.5 + mod(cell.b, float(MAX_LABELS)))

// return a vec4 from an array represented as "pseudo" 1D texture
#define LOOKUP(u2d, i, n)     texture2D(u2d, vec2((float(i) + 0.5) / float(n), 0.5))

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
uniform sampler2D   u_labels;
uniform lowp  int   u_states;
uniform bool        u_tick;
uniform bool        u_fade;
uniform vec2        u_neighCoord [NEIGH_SIZE];

//------------------------------------------------------------------------------
// constants
//------------------------------------------------------------------------------
//
const vec4 error        = vec4(0.5, 0.0, 0.5, 1.0); // purple


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

	// index into rule array
	highp int idx = 0;
	// array for determining the most frequent label
	lowp int labelCount [MAX_LABELS];

	// iterate over cells in neighborhood (including center)
	for (int i = NEIGH_SIZE - 1; i >= 0; i--) {
		vec4 neigh = texture2D(u_world, v_cellCoord + u_neighCoord[i]);
		
		// add state to rule index
		idx = idx*u_states + CELL_STATE(neigh);

		// increment count for label
		lowp int label = CELL_LABEL(neigh);
		for (int l = 0; l < MAX_LABELS; l++) {
			if (l == label) {
				labelCount[l]++;
			} // end if
		} // end for
	} // end for

	// determine most frequent label (mode)
	lowp int modeLabel = 0;
	lowp int modeCount = 0; // to select label 0 only if no others
	for (int l = 1; l < MAX_LABELS; l++) {
		if (labelCount[l] > modeCount) {
			modeLabel = l;
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

	// determine label for new cell
	vec4 labelColor = LOOKUP(u_labels, modeLabel, MAX_LABELS);

	// handle fading
	if (u_fade) {
		lowp int oldState = CELL_STATE(cell);
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
