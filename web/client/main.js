'use strict';

/**
 * Created by ghassaei on 2/20/16.
 */
var gl;
var canvas;
var currentState;
var lastState;
var frameBuffer;

var width;
var height;

var flipYLocation;
var tickLocation;
var textureSizeLocation;

var programInfo
var bufferInfo

let stepInterval;
let framerateInterval;
let framecount = 0;

//let viewProjectionMat;
let viewPort;
const gui = {};

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
    //canvas.width = canvas.clientWidth;
    //canvas.height = canvas.clientHeight;

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

    viewPort = new ViewportControl(canvas, changed)

    onResize();

    frameBuffer = gl.createFramebuffer();

    gui.speed = document.getElementById("speed");
    speed.oninput = () => {
        const q = (speed.value - speed.min) / (speed.max - speed.min)
        /*
        1000
        500
        250
        125, 1
        62.5, 2
        31.25, 4
        15, 8

        */
        const e = q * 3;
        const interval = 10 ** e;
        console.log(e, interval);
        if (stepInterval) {
            clearInterval(stepInterval);
        }
        stepInterval = setInterval(step, interval);
    }
    speed.oninput();

    // update framerate every second
    gui.framerate = document.getElementById("framerate");
    framerateInterval = setInterval(() => {
        gui.framerate.innerText = framecount + " FPS";
        framecount = 0;
    }, 1000);

    gui.resetZoom = document.getElementById("reset_zoom");
    gui.resetZoom.onclick = viewPort.reset.bind(viewPort);

    render();
    //setInterval(step, 1000);
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

let animate = null;
function changed() {
    // rendering already requested?
    if (animate != null) {
        // yes -> nothing to do
        return;
    }
    // schedule rendering before the next repaint
    animate = requestAnimationFrame(() => {
        animate = null;
        render();
        framecount++;
    });
}

function render(){

    //step();

    gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas
    gl.uniform1f(tickLocation, false);
    twgl.setUniforms(programInfo, {
        u_matrix: viewPort.matrix,
    });        

    //draw to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, currentState);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
}

function step(ticks = 1) {

    // don't y flip images while drawing to the textures
    gl.uniform1f(flipYLocation, 1);
    gl.uniform1f(tickLocation, true);
    twgl.setUniforms(programInfo, {
        u_matrix: m3.identity(),
    });

    // lastState will receive output from fragment shader
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    
    for (let i = 0; i < ticks; i++) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lastState, 0);
        gl.bindTexture(gl.TEXTURE_2D, currentState);
        twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

        // lastState is now our new currentState
        [currentState, lastState] = [lastState, currentState];
    }

    changed();
}

function onResize(){

    canvas.width = 512;//canvas.clientWidth;
    canvas.height = 512;//canvas.clientHeight;
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    gl.viewport(0, 0, width, height);

    // set the size of the texture
    gl.uniform2f(textureSizeLocation, width, height);

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

    // empty texture 
    lastState = twgl.createTexture(gl, {
        src: null,
        width: width,
        height: height,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.REPEAT,
    });
    // initial state
    currentState = twgl.createTexture(gl, {
        src: rgba,
        width: width,
        height: height,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.REPEAT,
    });

}

