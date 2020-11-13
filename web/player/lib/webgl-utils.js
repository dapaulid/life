/* jshint esversion: 6 */

const GLX_STATE = Symbol("GLX_STATE");

// our shaders will be loaded into this object in index.html
const shaders = {}; 
// template-string tag used in GLSL shaders
const glsl = x => x.join('\n');

const glx = {

	createContext: function(canvas, vertSrc, fragSrc, contextAttributes) {
		const gl = canvas.getContext('webgl', contextAttributes);
		
		const vertShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertShader, vertSrc);
		gl.compileShader(vertShader);

		const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragShader, fragSrc);
		gl.compileShader(fragShader);

		// create a program.
		const program = gl.createProgram();
		
		// attach the shaders.
		gl.attachShader(program, vertShader);
		gl.attachShader(program, fragShader);
		
		// link the program.
		gl.linkProgram(program);

		// delayed error checking to make use of parallelism
		if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
			throw Error("failed to compile vertex shader:\n" + gl.getShaderInfoLog(vertShader));
		}
		if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
			throw Error("failed to compile fragment shader:\n" + gl.getShaderInfoLog(fragShader));
		}
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw Error("failed to link WebGL program:\n" + gl.getProgramInfoLog(program));
		}		

		// use it
		gl.useProgram(program);

		this.initState(gl, program);

		return gl;
	},

	initState: function(gl, program) {

		const state = {
			program: program,
			uniforms: {},
			attributes: {}, 
			units: 0,
			numElements: 0,
		};

		// enumerate uniforms
		const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < numUniforms; i++) {
			const info      = gl.getActiveUniform(program, i);
			const isVector  = info.name.endsWith('[0]');
			const name      = isVector ? info.name.slice(0, -3) : info.name;
			const uniform   = state.uniforms[name] = {
				type    : info.type,
				location: gl.getUniformLocation(program, info.name),
			};
			if (info.type == gl.SAMPLER_2D) {
				uniform.unit = state.units++;
			}
			uniform.setter = createSetter(gl, uniform, isVector);
		}

		// enumerate attributes
		const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
		for (let i = 0; i < numAttributes; i++) {
			const info = gl.getActiveAttrib(program, i);
			const attribute = state.attributes[info.name] = {
				type    : info.type,
				location: gl.getAttribLocation(program, info.name),
			};
		}

		// set internal state
		gl[GLX_STATE] = state;
	},

	setUniforms: function(gl, uniforms) {
		const state = this.getState(gl);
		for (let name in uniforms) {
			const u = state.uniforms[name];
			if (!u) {
				throw Error("unknown uniform: " + name);
			}
			const value = uniforms[name];
			u.setter(value);
		}
	},

	setAttributes: function(gl, attributes) {
		const state = this.getState(gl);
		for (let name in attributes) {
			const a = state.attributes[name];
			if (!a) {
				throw Error("unknown attribute: " + name);
			}
			const info = a.info = attributes[name];

			// Create an empty buffer object
			const buffer = gl.createBuffer();
			// Bind appropriate array buffer to it
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			// Pass the vertex data to the buffer
			gl.bufferData(gl.ARRAY_BUFFER, info.vertices, gl[info.usage]);
         	// Point an attribute to the currently bound VBO
         	gl.vertexAttribPointer(a.location, info.size, gl.FLOAT, false, 0, 0);
	        // Enable the attribute
    	    gl.enableVertexAttribArray(a.location);
		}
		// update number of elements to draw
		// TODO use some kind of flag instead of special name?
		const pos = state.attributes.a_position;
		if (pos) {
			state.numElements = pos.info.vertices.length / pos.info.count;
		}
	},

	draw: function(gl) {
		const state = this.getState(gl);
		gl.drawArrays(gl.TRIANGLES, 0, state.numElements);
	},

	createTexture: function(gl, options) {
		// default values
		Object.assign(options, {
			target: gl.TEXTURE_2D,
			internalformat: gl.RGBA,
			format: gl.RGBA,
			type: gl.UNSIGNED_BYTE,
		});
		const target = options.target;
		const pixels = options.src && options.src.buffer ? new Uint8Array(options.src.buffer) : options.src;
		const texture = gl.createTexture();
		gl.bindTexture(target, texture);
		gl.texImage2D(target, 
			0, options.internalformat, 
			options.width, options.height, 
			0, options.format, 
			options.type, pixels);
		if (options.min) {
			gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, options.min);
		}
		if (options.mag) {
			gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, options.mag);
		}
		if (options.wrap) {
			gl.texParameteri(target, gl.TEXTURE_WRAP_S, options.wrap);
			gl.texParameteri(target, gl.TEXTURE_WRAP_T, options.wrap);
			if (target === gl.TEXTURE_3D) {
				gl.texParameteri(target, gl.TEXTURE_WRAP_R, options.wrap);
			}
		}
		return texture;
	},

	rectangle: function(left, top, width, height) {
		const [right, bottom] = [left+width, top+height];
		return {
			mode: 'TRIANGLES',
			size: 2, // dimensions
			count: 2,
			vertices: new Float32Array([
				left,top,      right,top,  left,bottom,
				right,bottom,  right,top,  left,bottom,
			]),
			usage: 'STATIC_DRAW',
		};
	},

	getState: function(gl) {
		const state = gl[GLX_STATE];
		if (!state) {
			throw Error("gl object has no GLX_STATE");
		}
		return state;
	},

	colorToVec4: function(color) {
		const flat = [].concat.apply([], color);
		return new Float32Array(flat.map(x => x / 255));
	},

};

function createSetter(gl, u, isVector) {
	if (!isVector) {
		switch (u.type) {
			case gl.FLOAT          : return (value) => gl.uniform1f(u.location, value);
			case gl.FLOAT_VEC2     : return (value) => gl.uniform2f(u.location, ...value);
			case gl.FLOAT_VEC3     : return (value) => gl.uniform3f(u.location, ...value);
			case gl.FLOAT_VEC4     : return (value) => gl.uniform4f(u.location, ...value);
			case gl.INT            : return (value) => gl.uniform1i(u.location, value);
			case gl.INT_VEC2       : return (value) => gl.uniform12(u.location, ...value);
			case gl.INT_VEC3       : return (value) => gl.uniform13(u.location, ...value);
			case gl.INT_VEC4       : return (value) => gl.uniform14(u.location, ...value);
			case gl.BOOL           : return (value) => gl.uniform1i(u.location, value);
			case gl.BOOL_VEC2      : return (value) => gl.uniform12(u.location, ...value);
			case gl.BOOL_VEC3      : return (value) => gl.uniform13(u.location, ...value);
			case gl.BOOL_VEC4      : return (value) => gl.uniform14(u.location, ...value);
			case gl.FLOAT_MAT2     : return (value) => gl.uniformMatrix2fv(u.location, false, new Float32Array(value));
			case gl.FLOAT_MAT3     : return (value) => gl.uniformMatrix3fv(u.location, false, new Float32Array(value));
			case gl.FLOAT_MAT4     : return (value) => gl.uniformMatrix4fv(u.location, false, new Float32Array(value));
			case gl.SAMPLER_2D     : 
				return function(texture) {
					gl.uniform1i(u.location, u.unit);
					gl.activeTexture(gl.TEXTURE0 + u.unit);
					gl.bindTexture(gl.TEXTURE_2D, texture);
				};
			case gl.SAMPLER_CUBE   : throw Error("SAMPLER_CUBE not yet implemented");
		}
	} else {
		switch (u.type) {
			case gl.FLOAT          : return (value) => gl.uniform1fv(u.location, value, value.length);
			case gl.FLOAT_VEC2     : return (value) => gl.uniform2fv(u.location, value, value.length);
			case gl.FLOAT_VEC3     : return (value) => gl.uniform3fv(u.location, value, value.length);
			case gl.FLOAT_VEC4     : return (value) => gl.uniform4fv(u.location, value, value.length);
			case gl.INT            : return (value) => gl.uniform1iv(u.location, value, value.length);
			case gl.INT_VEC2       : return (value) => gl.uniform12v(u.location, value, value.length);
			case gl.INT_VEC3       : return (value) => gl.uniform13v(u.location, value, value.length);
			case gl.INT_VEC4       : return (value) => gl.uniform14v(u.location, value, value.length);
			case gl.BOOL           : return (value) => gl.uniform1iv(u.location, value, value.length);
			case gl.BOOL_VEC2      : return (value) => gl.uniform12v(u.location, value, value.length);
			case gl.BOOL_VEC3      : return (value) => gl.uniform13v(u.location, value, value.length);
			case gl.BOOL_VEC4      : return (value) => gl.uniform14v(u.location, value, value.length);
		}
	}
	throw Error("Unknown WebGL uniform type: " + u.type);
}
