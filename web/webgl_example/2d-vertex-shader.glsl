shaders["2d-vertex"] = `// GLSL vertex shader code

attribute vec2 a_position;

uniform float u_flipY;

attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
	gl_Position = vec4(a_position.x, u_flipY*a_position.y, 0, 1);
	v_texCoord = a_texCoord;
}

`; // end GLSL shader code
