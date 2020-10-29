const GLX_STATE = Symbol("GLX_STATE");

const glx = {

	initState: function(gl, program) {

		const state = {
			uniforms: {},
			units: 0,
		};

		const uniforms = {}
		const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < numUniforms; i++) {
			const info = gl.getActiveUniform(program, i);
			const uniform = state.uniforms[info.name] = {
				type    : info.type,
				location: gl.getUniformLocation(program, info.name),
			}
			if (info.type == gl.SAMPLER_2D) {
				uniform.unit = state.units++;
			}
			uniform.setter = createSetter(gl, uniform);
		}

		console.log(state);

		gl[GLX_STATE] = state;
	},

	setUniforms: function(gl, uniforms) {
		const state = gl[GLX_STATE];
		if (!state) {
			throw Error("gl object has no GLX_STATE");
		}
		for (let name in uniforms) {
			const u = state.uniforms[name];
			if (!u) {
				throw Error("unknown uniform: " + name);
			}
			u.setter(uniforms[name]);
		}
	},

}

function createSetter(gl, u) {
	switch (u.type) {
		case gl.FLOAT          : return gl.uniform1f.bind(gl, u.location);
		case gl.FLOAT_VEC2     : return gl.uniform2f.bind(gl, u.location);
		case gl.FLOAT_VEC3     : return gl.uniform3f.bind(gl, u.location);
		case gl.FLOAT_VEC4     : return gl.uniform4f.bind(gl, u.location);
		case gl.INT            : return gl.uniform1i.bind(gl, u.location);
		case gl.INT_VEC2       : return gl.uniform2i.bind(gl, u.location);
		case gl.INT_VEC3       : return gl.uniform3i.bind(gl, u.location); 
		case gl.INT_VEC4       : return gl.uniform4i.bind(gl, u.location); 
		case gl.BOOL           : return gl.uniform1i.bind(gl, u.location);
		case gl.BOOL_VEC2      : return gl.uniform2i.bind(gl, u.location);
		case gl.BOOL_VEC3      : return gl.uniform3i.bind(gl, u.location);
		case gl.BOOL_VEC4      : return gl.uniform4i.bind(gl, u.location);
		case gl.FLOAT_MAT2     : return gl.uniformMatrix2fv.bind(gl, u.location, false);
		case gl.FLOAT_MAT3     : return gl.uniformMatrix3fv.bind(gl, u.location, false);
		case gl.FLOAT_MAT4     : return gl.uniformMatrix4fv.bind(gl, u.location, false);
		case gl.SAMPLER_2D     : 
			return function(texture) {
				gl.uniform1i(u.location, u.unit);
				gl.activeTexture(gl.TEXTURE0 + u.unit);
				gl.bindTexture(gl.TEXTURE_2D, texture);
			};
		case gl.SAMPLER_CUBE   : throw Error("SAMPLER_CUBE not yet implemented");
	}
	throw Error("Unknown WebGL uniform type: " + u.type);
}