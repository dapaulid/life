'use strict';
/**
 * Created by ghassaei on 2/20/16.
 */
var gl;
var canvas;
var lastState;
var currentState;
var frameBuffer;

var resizedLastState;
var resizedCurrentState;

var width;
var height;

var flipYLocation;
var tickLocation;
var textureSizeLocation;

var programInfo
var bufferInfo

var paused = false;//while window is resizing

//let viewProjectionMat;
let viewPort;

// our shaders will be loaded into this object in index.html
const shaders = {}; 
// template-string tag used in GLSL shaders
const glsl = x => x.join('\n');

window.onload = initGL;

const rule = Rule.random(2); //new Rule([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1])

console.log(rule.array.toString());
const encoded = rule.encode();
console.log(encoded, encoded.length);
const decoded = Rule.decode(encoded);
console.log(decoded.array.toString());
console.log(rule.array.toString() == decoded.array.toString());


function initGL() {

    // Get A WebGL context
    canvas = document.getElementById("glcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl = twgl.getWebGLContext(canvas, { antialias: false });
    if (!gl) {
        alert('Could not initialize WebGL, try another browser');
        return;
    }

    gl.disable(gl.DEPTH_TEST);

    // setup a GLSL program
    programInfo = twgl.createProgramInfo(gl, 
        [shaders["2d-vertex"], shaders["2d-fragment"]],
        null, null,
        err => { throw "TWGL error:\n" + err }
    );
    var program = programInfo.program;

    gl.useProgram(program);


    // vertex shader attributes
    const arrays = {
        a_position: { 
            numComponents: 2, 
            data: [
                -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
                -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,
            ]
        },
        a_texCoord: { 
            numComponents: 2, 
            data: [
                 0.0,  0.0,  1.0,  0.0,  0.0,  1.0,
                 0.0,  1.0,  1.0,  0.0,  1.0,  1.0
            ]
        }
    };
    bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);


    //flip y
    flipYLocation = gl.getUniformLocation(program, "u_flipY");
    tickLocation = gl.getUniformLocation(program, "u_tick");

    textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    viewPort = new ViewportControl(canvas, /*render*/)

    onResize();

    lastState = resizedLastState;
    currentState = resizedCurrentState;
    resizedLastState = null;
    resizedCurrentState = null;

    frameBuffer = gl.createFramebuffer();

    gl.bindTexture(gl.TEXTURE_2D, lastState);//original texture

    render();
}

const alive = [0.5,1.0,0.7,1.0]

function makeRandomArray(rgba){
    var numPixels = rgba.length/4;
    var probability = 0.15;
    for (var i=0;i<numPixels;i++) {
        var ii = i * 4;
        var state = Math.random() < probability ? 1 : 0;
        if (state) {
            rgba[ii] = alive[0] * 255;
            rgba[ii+1] = alive[1] * 255;
            rgba[ii+2] = alive[2] * 255;
        }
        //rgba[ii + 1] = rgba[ii + 2] = state ? 255 : 0;
        rgba[ii + 3] = 255;
    }
    return rgba;
}

function makeTexture(gl){

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

function render(){

    if (!paused) {

        if (resizedLastState) {
            lastState = resizedLastState;
            resizedLastState = null;
        }
        if (resizedCurrentState) {
            currentState = resizedCurrentState;
            resizedCurrentState = null;
        }
       
        // don't y flip images while drawing to the textures
        gl.uniform1f(flipYLocation, 1);
        gl.uniform1f(tickLocation, true);
        twgl.setUniforms(programInfo, {
            u_matrix: m3.identity(),
          });

        step();

        gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas
        gl.uniform1f(tickLocation, false);
        twgl.setUniforms(programInfo, {
            u_matrix: viewPort.matrix,
        });        
        //gl.bindTexture(gl.TEXTURE_2D, lastState);

        //draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, lastState);  // TODO correct?
        twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
    }

    window.requestAnimationFrame(render);
}

function step(){
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentState, 0);

    gl.bindTexture(gl.TEXTURE_2D, lastState);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

    var temp = lastState;
    lastState = currentState;
    currentState = temp;
}

function onResize(){
    paused = true;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    gl.viewport(0, 0, width, height);

    // set the size of the texture
    gl.uniform2f(textureSizeLocation, width, height);

    //texture for saving output from frag shader
    resizedCurrentState = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    resizedLastState = makeTexture(gl);

    var rgba = new Uint8Array(width*height*4);
    for (var i=0;i<rgba.length/4;i++) {
        var ii = i * 4;
        rgba[ii] = 0
        rgba[ii+1] = 0
        rgba[ii+2] = 0
        rgba[ii+3] = 255;
    }    
    const m = (Math.floor(rgba.length/4)/2)*4;
    rgba[m] = alive[0] * 255;
    rgba[m+1] = alive[1] * 255;
    rgba[m+2] = alive[2] * 255;

    rgba = makeRandomArray(rgba);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);

    paused = false;
}

