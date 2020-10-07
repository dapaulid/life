shaders["2d-fragment"] = glsl` // fragment shader

precision mediump float;

uniform sampler2D u_image;//texture array

varying vec2 v_texCoord;
uniform vec2 u_textureSize;

uniform bool u_tick;

vec4 live = vec4(0.5,1.0,0.7,1.);
vec4 dead = vec4(0.,0.,0.,1.);
vec4 blue = vec4(0.,0.,1.,1.);

void main() {

	vec4 me = texture2D(u_image, v_texCoord);
	if (!u_tick) {
		gl_FragColor = me;
		return;
	}

	vec2 onePixel = vec2(1.0, 1.0)/u_textureSize;

	vec4 rawTextureData = texture2D(u_image, v_texCoord);

	float sum = 0.;
	for (int i=-1;i<2;i++){
		for (int j=-1;j<2;j++){
			if (i == 0 && j == 0) continue;
			vec2 neighborCoord = v_texCoord + vec2(onePixel.x*float(i), onePixel.y*float(j));
			sum += texture2D(u_image, neighborCoord).g;
		}
	}

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
	}

}

`; // end fragment shader