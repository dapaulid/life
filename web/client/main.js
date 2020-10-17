'use strict';

/**
 * Created by ghassaei on 2/20/16.
 */
var gl;
var canvas;
var currentState;
var lastState;
var frameBuffer;

const world = {
    width: 64,
    height: 64,
    tick: 0,
    history: null,
}

const speeds = [
    1, 2, 5, 10, 25, 50, 100, 250, 500, 1000
];

var flipYLocation;
var tickLocation;
var textureSizeLocation;

var programInfo
var bufferInfo

let stepInterval;
let framecount = 0;
let tickcount = 0;
let ticksPerSec = 0;

//let viewProjectionMat;
let viewPort;
const gui = {};

// our shaders will be loaded into this object in index.html
const shaders = {}; 
// template-string tag used in GLSL shaders
const glsl = x => x.join('\n');

window.onload = initGL;

const rule = Rule.random(2); //new Rule([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1])

const conway = Rule.generate(2, (cell, counts) => {
    // 1. Any live cell with two or three live neighbours survives.
    if ((cell == 1) && ((counts[1] == 2) || (counts[1] == 3))) {
        return 1;
    }
    // 2. Any dead cell with three live neighbours becomes a live cell.
    if ((cell == 0) && (counts[1] == 3)) {
        return 1;
    }
    // 3. All other live cells die in the next generation. Similarly, all other dead cells stay dead.
    return 0;
});
console.log(conway.encode());

function initGL() {

    // Get A WebGL context
    canvas = document.getElementById("glcanvas");

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

    frameBuffer = gl.createFramebuffer();

    gui.outTicksPerSec = document.getElementById("outTicksPerSec");

    gui.rngSpeed = document.getElementById("rngSpeed");
    gui.rngSpeed.oninput = () => {
        ticksPerSec = speeds[rngSpeed.value];
        gui.outTicksPerSec.value = ticksPerSec + " tick/s";
        let interval = 1000 / ticksPerSec;
        if (stepInterval) {
            clearInterval(stepInterval);
        }
        stepInterval = setInterval(step, interval);
    }
    gui.rngSpeed.oninput();

    // update framerate every second
    gui.outFPS = document.getElementById("outFPS");
    gui.outTPS = document.getElementById("outTPS");
    setIntervalAndRun(() => {
        gui.outTPS.value = "TPS: " + tickcount;
        tickcount = 0;        
        gui.outFPS.value = "FPS: " + framecount;
        framecount = 0;
    }, 1000);

    gui.btnResetView = document.getElementById("btnResetView");
    gui.btnResetView.onclick = viewPort.reset.bind(viewPort);

    gui.btnPause = document.getElementById("btnPause");
    gui.btnPause.onclick = pause;

    gui.btnTick = document.getElementById("btnTick");
    gui.btnTick.onclick = () => {
        step(1);
    };
    gui.btnTick.disabled = true;

    gui.btnPreviousMark = document.getElementById("btnPreviousMark");
    gui.btnPreviousMark.onclick = previousMark;

    gui.btnNextMark = document.getElementById("btnNextMark");
    gui.btnNextMark.onclick = nextMark;    

    gui.btnResetWorld = document.getElementById("btnResetWorld");
    gui.btnResetWorld.onclick = reset;

    gui.cbxSize = document.getElementById("cbxSize");
    const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    for (let size = 16; size <= maxSize; size <<= 1) {
        const label = (size > 4096 ? "⚠️" : "") + size;
        gui.cbxSize.add(new Option(label, size));
    }
    gui.cbxSize.value = Math.min(1024, maxSize);
    

    gui.edtRule = document.getElementById("edtRule");

    gui.btnRandom = document.getElementById("btnRandom");
    gui.btnRandom.onclick = random;

    gui.outTick = document.getElementById("outTick");

    canvas.addEventListener('dblclick', pause);

    // get initial values
    const params = getUrlParams();
    gui.cbxSize.value = params.size || gui.cbxSize.value;
    gui.edtRule.value = params.rule || gui.edtRule.value;

    reset();
    setIntervalAndRun(updateStatus, 100);
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

    gl.viewport(0, 0, canvas.width, canvas.height);

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

    gl.viewport(0, 0, world.width, world.height);

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

        // increase time
        world.tick++

        // set a navigation mark every second
        if (world.tick % ticksPerSec == 0) {
            setMark();
        }

        // statistics
        tickcount++;
    }

    changed();
}

let paused = false;
function pause() {
    if (paused) {
        gui.rngSpeed.oninput();
        gui.btnPause.className = "button icon-pause";
        gui.btnTick.disabled = true;
        paused = false;
    } else {
        clearInterval(stepInterval);
        gui.btnPause.className = "button icon-play";
        gui.btnTick.disabled = false;        
        paused = true;
    }
}

class History {
    constructor(capacity) {
        this.states = new Map();
        this.capacity = capacity
    }

    clear() {
        this.states.clear();
    }

    add(tick, state) {
        if (this.states.size >= this.capacity) {
            // delete first to free space
            this.states.delete(this.states.keys().next().value);
        }
        this.states.set(tick, state);
        console.log("History size: " + (this.getMemoryUsage() >> 10) + " KB");
    }

    get(tick) {
        return this.states.get(tick);
    }

    has(tick) {
        return this.states.has(tick);
    }

    previous(tick) {
        return this.reduce((ret, e) => ((e[0] < tick) && (!ret || (e[0] > ret[0]))) ? e : ret) || [null, null];
    }

    next(tick) {
        return this.reduce((ret, e) => ((e[0] > tick) && (!ret || (e[0] < ret[0]))) ? e : ret) || [null, null];
    }    

    getSize() {
        return this.states.size;
    }

    getMemoryUsage() {
        let bytes = 0;
        for (let state of this.states.values()) {
            bytes += state.byteLength;
        }
        return bytes;
    }

    empty() {
        return this.states.size == 0;
    }

    reduce(callback, initialValue) {
        let ret = initialValue;
        for (let e of this.states) {
            ret = callback(ret, e);
        }
        return ret;        
    }    
}

function reset() {

    // update world properties from GUI
    world.width = gui.cbxSize.value;
    world.height = gui.cbxSize.value;
    world.history = new History(32);

    setUrlParams({
        size: gui.cbxSize.value,
        rule: gui.edtRule.value,
    });

    // set the size of the texture
    gl.uniform2f(textureSizeLocation, world.width, world.height);

    var rgba = new Uint8Array(world.width*world.height*4);
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
        width: world.width,
        height: world.height,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.REPEAT, // needs power of 2
    });
    // initial state
    currentState = twgl.createTexture(gl, {
        src: rgba,
        width: world.width,
        height: world.height,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.REPEAT, // needs power of 2
    });

    // big bang conditions
    world.tick = 0;

    // remember initial state
    setMark();

    // ready to render
    changed();
}

function setCurrentState(data) {
    gl.bindTexture(gl.TEXTURE_2D, currentState)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, world.width, world.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    changed();
}

function getCurrentState() {
    let data = new Uint8Array(world.width * world.height * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentState, 0);
    gl.readPixels(0, 0, world.width, world.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return data;
}

function random() {
    gui.edtRule.value = Rule.random(2).encode();
    reset();
}

function updateStatus() {
    gui.outTick.value = "Tick: " + world.tick;
}

function setTick(tick) {
    world.tick = tick;
}

function setMark() {
    // update history
    if (!world.history.has(world.tick)) {
        world.history.add(world.tick, getCurrentState());
    }
}

function previousMark() {
    let [tick, state] = world.history.previous(world.tick);
    if (tick != null) {
        setCurrentState(state);
        setTick(tick);
    }
    return tick;
}

function nextMark() {
    let [tick, state] = world.history.next(world.tick);
    if (tick != null) {
        setCurrentState(state);
        setTick(tick);
    }
    return tick;
}

//------------------------------------------------------------------------------
// helpers
//------------------------------------------------------------------------------

function setIntervalAndRun(handler, timeout) {
    handler();
    return setInterval(handler, timeout)
}

function setUrlParams(params) {
    const searchParams = new URLSearchParams(location.search);
    for (let key in params) {
        if ((params[key] != null) && (params[key] != "")) {
            searchParams.set(key, params[key]);
        }
    }
    window.history.replaceState(null, '', location.pathname + '?' + searchParams.toString());
}

function getUrlParams() {
    const params = {};
    const searchParams = new URLSearchParams(location.search);
    for (let entry of searchParams.entries()) {
        params[entry[0]] = entry[1];
    }
    return params;
}