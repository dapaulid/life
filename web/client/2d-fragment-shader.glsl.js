shaders["2d-fragment"] = glsl` // fragment shader

#define STATES 2
#define NEIGH 9
#define RULESIZE 512

#define DEBUG 1

#define RETURN(color)  gl_FragColor = color; return;

precision mediump float;

uniform sampler2D u_image;//texture array
uniform sampler2D u_rule;

varying vec2 v_texCoord;
uniform vec2 u_textureSize;

uniform bool u_tick;
uniform bool u_fade;

vec4 live   = vec4(0.5, 1.0, 0.7, 1.0); // green-ish
vec4 dead   = vec4(0.0, 0.0, 0.0, 1.0); // black
vec4 blue   = vec4(0.0, 0.0, 1.0, 1.0); // blue
vec4 error  = vec4(0.5, 0.0, 0.5, 1.0); // purple

void main() {

	vec4 cell = texture2D(u_image, v_texCoord);

	if (!u_tick) {
		RETURN(cell);
	}

	lowp int oldState = int(0.5 + cell.g);

	vec2 px = vec2(1.0, 1.0)/u_textureSize;

	highp int idx =    int(0.5 + texture2D(u_image, v_texCoord + vec2( 1.0, -1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2( 0.0, -1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2(-1.0, -1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2(-1.0,  0.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2(-1.0,  1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2( 0.0,  1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2( 1.0,  1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2( 1.0,  0.0)*px).g);
	idx = idx*STATES + oldState;

#if DEBUG
	if (idx < 0 || idx > 511) {
		RETURN(error);
	}
#endif

	lowp int newState = int(0.5 + texture2D(u_rule, vec2((float(idx) + 0.5) / float(RULESIZE), 0.5)).r);

	if (newState == 1) {
		RETURN(live);
	} else if (newState == 0) {
		if (u_fade) {
			// handle fade out
			if (oldState == 1) {
				// just died
				RETURN(blue);
			} else if (cell.b > 0.0) {
				// fade out
				RETURN(vec4(0.0, 0.0, max(cell.b - 0.004, 0.25), 1.0));
			}
		}
		RETURN(dead);
	} else {
		// unknown state
		RETURN(error);
	}

}

`; // end fragment shader
