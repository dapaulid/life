'use strict';

/**
 * Created by ghassaei on 2/20/16.
 */
var gl;
var canvas;
var currentState;
var lastState;
var frameBuffer;
var ruleTex;
const alive = [0.5,1.0,0.7,1.0]
const stateColors = [
    color(0x00, 0x00, 0x00),
    color(0x80, 0xff, 0xb3),
]

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

const world = {
    width: 64,
    height: 64,
    tick: 0,
    history: null,
    tempLastMark: null,
    rule: conway,
}

const speeds = [
    1, 2, 5, 10, 25, 50, 100, 250, 500, 1000
];

var flipYLocation;
var tickLocation;
var textureSizeLocation;

var imageLoc;
var ruleLoc;

var programInfo
var bufferInfo

let framecount = 0;
let tickcount = 0;
let ticksPerSec = 0;

let stepTimer = new Timer(() => {
    const ticksPerStep = Math.ceil(ticksPerSec / 1000 * stepTimer.interval);
    step(ticksPerStep);
});

//let viewProjectionMat;
let viewPort;
let gui;

// our shaders will be loaded into this object in index.html
const shaders = {}; 
// template-string tag used in GLSL shaders
const glsl = x => x.join('\n');

window.onload = initGL;

const rule = Rule.random(2); //new Rule([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1])

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

    imageLoc = gl.getUniformLocation(program, "u_image");
    ruleLoc = gl.getUniformLocation(program, "u_rule");

    textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    viewPort = new ViewportControl(canvas, changed)

    frameBuffer = gl.createFramebuffer();

    // init GUI
    gui = guiu.initElements(document, {
        // outputs
        outTPS: {},
        outFPS: {},
        outTicksPerSec: {},        
        outTick: {},
        // inputs
        edtRule: {},
        cbxSize: {},
        // buttons -> event handlers
        btnPause        : pause,
        btnTick         : () => step(1),
        btnPreviousMark : previousMark,
        btnNextMark     : nextMark,
        btnResetWorld   : reset,
        btnResetView    : viewPort.reset.bind(viewPort),
        btnRandom       : random,
        // position slider
        rngTick: {
            event: (e) => {
                if (!paused) {
                    pause();
                }
                moveToMark(e.target.value);
            },
            options: { wheelable: true },
        },
        // speed slider
        rngSpeed: {
            event: updateTicksPerSec,
            options: { wheelable: true },
        },
    });

    // update framerate every second
    setIntervalAndRun(() => {
        gui.outTPS.value = "TPS: " + tickcount;
        gui.outTPS.classList.toggle("bad", (tickcount < ticksPerSec) && !paused);
        tickcount = 0;        
        gui.outFPS.value = "FPS: " + framecount;
        framecount = 0;
    }, 1000);

    // populate world sizes
    const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    for (let size = 16; size <= maxSize; size <<= 1) {
        const label = (size > 4096 ? "⚠️" : "") + size;
        gui.cbxSize.add(new Option(label, size));
    }
    gui.cbxSize.value = Math.min(1024, maxSize);
    

    canvas.addEventListener('dblclick', pause);

    window.addEventListener('keydown', (e) => {
        // handle key
        switch (e.code) {
        case 'Space': 
            if (e.ctrlKey) {
                step(1);
            } else {
                pause();
            }
            break;
        default:
            // ignore
            return;
        }
        // when we get here, we handled the key
        e.preventDefault();
        // is an input element focused?
        if (e.target.tagName.toLowerCase() == 'input') {
            // yes -> emit a warning, as we might "steal" its input,
            // which may not be what we want in all cases
            console.debug("global keydown handled while input element was active");
        }        
    })

    // get initial values
    const params = getUrlParams();
    gui.cbxSize.value = params.size || gui.cbxSize.value;
    gui.edtRule.value = params.rule || gui.edtRule.value;

    reset();
    setIntervalAndRun(updateStatus, 100);
    stepTimer.start();
}

function makeRandomArray(rgba){
    var probability = 0.15;
    for (var i=0;i<rgba.length;i++) {
        var state = Math.random() < probability ? 1 : 0;
        rgba[i] = stateColors[state];
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
    
    //gl.bindTexture(gl.TEXTURE_2D, currentState);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currentState);
    gl.uniform1i(imageLoc, 0); 

    //gl.activeTexture(gl.TEXTURE3);
    //gl.bindTexture(gl.TEXTURE_2D, ruleTex);
    //gl.uniform1i(ruleLoc, 3); 

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

    /*
    twgl.setUniforms(programInfo, {
        u_rule: 0,
    });*/
    
    // lastState will receive output from fragment shader
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    
    for (let i = 0; i < ticks; i++) {

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lastState, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, currentState);
        gl.uniform1i(imageLoc, 0); 

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, ruleTex);
        gl.uniform1i(ruleLoc, 3); 

        twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

        // lastState is now our new currentState
        [currentState, lastState] = [lastState, currentState];

        // increase time
        setTick(world.tick + 1);

        // set a navigation mark every second
        if (world.tick % ticksPerSec == 0) {
            setMark();
        }

        // statistics
        tickcount++;
    }

    updateControls();
    changed();
}

let paused = false;
function pause() {
    if (paused) {
        stepTimer.start();
        paused = false;
    } else {
        stepTimer.stop();
        paused = true;
    }
    updateControls();
}

class History {
    constructor(capacity) {
        this.states = new Map();
        this.ticks = new SortedArray();
        this.capacity = capacity
        this.memoryUsage = 0; // bytes
        this.clear()
    }

    clear() {
        this.states.clear();
        this.ticks.clear();
        this.memoryUsage = 0;
    }

    add(tick, state) {
        if (this.has(tick)) {
            return false;
        }
        if (this.memoryUsage + state.byteLength > this.capacity) {
            // make room
            if (!this.freeMemory(state.byteLength)) {
                return false;
            }
        }
        this.states.set(tick, state);
        this.ticks.add(tick);
        this.memoryUsage += state.byteLength;
        console.debug("[History] added tick " + tick + ", memory usage: " + this.getUsagePercent() + "%");
    }

    remove(tick) {
        let state = this.get(tick);
        if (!state) {
            return false;
        }
        this.states.delete(tick);
        this.ticks.remove(tick);
        this.memoryUsage -= state.byteLength;
        console.debug("[History] removed tick " + tick + ", memory usage: " + this.getUsagePercent() + "%");
        return true;
    }

    get(tick) {
        return this.states.get(tick);
    }

    has(tick) {
        return this.states.has(tick);
    }

    indexToTick(index) {
        return this.ticks.get(index);
    }

    tickToIndex(tick) {
        return this.ticks.lowerBound(tick);
    }    

    previous(tick) {
        return this.reduce((ret, e) => ((e[0] < tick) && (!ret || (e[0] > ret[0]))) ? e : ret) || [null, null];
    }

    next(tick) {
        return this.reduce((ret, e) => ((e[0] > tick) && (!ret || (e[0] < ret[0]))) ? e : ret) || [null, null];
    }    

    get count() {
        return this.states.size;
    }

    get first() {
        return this.ticks.first;
    }

    get last() {
        return this.ticks.last;
    }

    freeMemory(bytes) {
        while ((bytes > 0) && !this.empty()) {
            let [tick, state] = this.states.entries().next().value;
            this.remove(tick);
            bytes -= state.byteLength;

        }
        return bytes <= 0;
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

    getUsagePercent() {
        return Math.round(this.memoryUsage / this.capacity * 100);
    }
}

function reset() {

    // update world properties from GUI
    world.width = gui.cbxSize.value;
    world.height = gui.cbxSize.value;
    world.rule = Rule.decode(gui.edtRule.value);
    world.history = new History(1024*1024*100);
    world.tempLastMark = null;

    setUrlParams({
        size: gui.cbxSize.value,
        rule: gui.edtRule.value,
    });

    // set the size of the texture
    gl.uniform2f(textureSizeLocation, world.width, world.height);

    var rgba = new Uint32Array(world.width*world.height);
    rgba.fill(stateColors[0]);
    rgba[rgba.length/2+world.width/2] = stateColors[1];

    //rgba = makeRandomArray(rgba);

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
        src: new Uint8Array(rgba.buffer),
        width: world.width,
        height: world.height,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.REPEAT, // needs power of 2
    });

    gl.activeTexture(gl.TEXTURE3)
    const tex = new Uint32Array(512);
    for (let i = 0; i < world.rule.length; i++) {
        tex[i] = color(world.rule.array[i] * 0xff, 0x00, 0x00);
    }
    ////tex.fill(color(0xff, 0x00, 0x00));
    //tex.fill(color(0xff, 0x00, 0x00), 0, 255);
    //tex[255] = color(0x00, 0x00, 0xff);
    //tex.fill(color(0x00, 0xff, 0x00), 256, 512);
    ruleTex = twgl.createTexture(gl, {
        src: new Uint8Array(tex.buffer),
        width: tex.length,
        height: 1,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE, // needs power of 2
    });
    gl.activeTexture(gl.TEXTURE0)

    // big bang conditions
    setTick(0);

    // remember initial state
    setMark();

    // ready to render
    updateControls();
    updateTicksPerSec();
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
    gui.outTick.value = world.tick;
}

function updateTicksPerSec() {
    ticksPerSec = speeds[gui.rngSpeed.value];
    gui.outTicksPerSec.value = ticksPerSec + " tick/s";
    stepTimer.setInterval(Math.max(1000 / ticksPerSec, 50));
}

function updateControls() {
    // update button states
    gui.btnPause.className = paused ? "button icon-play" : "button icon-pause";
    gui.btnTick.disabled = !paused;    
    gui.btnPreviousMark.disabled = world.history.empty() || (world.history.first >= world.tick);
    gui.btnNextMark.disabled = world.history.empty() || (world.history.last <= world.tick);
    if (world.history.count > 1) {
        gui.rngTick.max = world.history.count-1;
        gui.rngTick.value = world.history.tickToIndex(world.tick);
    } else {
        // initial position: make slider appear on the right
        gui.rngTick.max = 1;
        gui.rngTick.value = 1;
    }
}

function setTick(tick) {
    world.tick = tick;
}

function setMark() {
    // did we surpass a temporary mark?
    if ((world.tempLastMark != null) && (world.tempLastMark < world.tick)) {
        // yes -> remove it
        world.history.remove(world.tempLastMark);
        world.tempLastMark = null;
    }
    // update history
    if (!world.history.has(world.tick)) {
        world.history.add(world.tick, getCurrentState());
    }
    // update tick slider
    updateControls();
    return world.tick;
}

function moveToMark(index) {
    const tick = world.history.indexToTick(index);
    setCurrentState(world.history.get(tick));
    setTick(tick);
    updateControls();
}

function previousMark() {
    // do we have a mark here yet?
    if (world.history.last < world.tick) {
        // no -> set a temporary mark here so that we'll find back
        world.tempLastMark = setMark();
    }
    let [tick, state] = world.history.previous(world.tick);
    if (tick == null) {
        return null;
    }
    setCurrentState(state);
    setTick(tick);
    updateControls();
    return tick;
}

function nextMark() {
    let [tick, state] = world.history.next(world.tick);
    if (tick == null) {
        return null;
    }
    setCurrentState(state);
    setTick(tick);
    updateControls();
    return tick;
}

//------------------------------------------------------------------------------
// helpers
//------------------------------------------------------------------------------

function color(r, g, b, a = 0xff) {
    return r | (g << 8) | (b << 16) | (a << 24);
}

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