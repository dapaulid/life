shaders["2d-fragment"] = glsl` // fragment shader

#define STATES 2
#define NEIGH 9
#define RULESIZE 512

precision mediump float;

uniform sampler2D u_image;//texture array
uniform sampler2D u_rule;

varying vec2 v_texCoord;
uniform vec2 u_textureSize;

uniform bool u_tick;

vec4 live = vec4(0.5,1.0,0.7,1.);
vec4 dead = vec4(0.,0.,0.,1.);
vec4 blue = vec4(0.,0.,1.,1.);

void main() {

	//gl_FragColor = texture2D(u_rule, vec2((float(511) + 0.5) / float(RULESIZE), 0.5));
	//return;

	vec4 me = texture2D(u_image, v_texCoord);
	if (!u_tick) {
		gl_FragColor = me;
		return;
	}

	vec2 px = vec2(1.0, 1.0)/u_textureSize;

	highp int idx =    int(0.5 + texture2D(u_image, v_texCoord + vec2( 1.0, -1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2( 0.0, -1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2(-1.0, -1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2(-1.0,  0.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2(-1.0,  1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2( 0.0,  1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2( 1.0,  1.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord + vec2( 1.0,  0.0)*px).g);
	idx = idx*STATES + int(0.5 + texture2D(u_image, v_texCoord).g);

	if (idx < 0 || idx > 511) {
		gl_FragColor = blue;
		return;
	}

	lowp int newState = int(0.5 + texture2D(u_rule, vec2((float(idx) + 0.5) / float(RULESIZE), 0.5)).r);

	if (newState == 1) {
		gl_FragColor = live;
	} else if (newState == 0) {
		gl_FragColor = dead;
	} else {
		gl_FragColor = blue;
	}

	/*
	if (me.g <= 0.1) {
		if ((sum >= 2.9) && (sum <= 3.1)) {
			gl_FragColor = live;
		} else if (me.b > 0.004) {
			gl_FragColor = vec4(0., 0., max(me.b - 0.004, 0.25), 1.0);
		} else {
			gl_FragColor = dead;
		}
	} else {
		if ((sum >= 1.9) && (sum <= 3.1)) {
			gl_FragColor = live;
		} else {
			gl_FragColor = blue;
		}
	}*/

}

`; // end fragment shader
