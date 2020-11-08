/* jshint esversion: 6 */

var gl;
var currentState;
var lastState;
var frameBuffer;

const alive = [0.5,1.0,0.7,1.0];
const stateColors = [
    color(0x00, 0x00, 0x00),
    color(0x80, 0xff, 0xb3),
];

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

const examples = {
    "cool_fade"         : "w0a264105jgh0Q0jg2000380U89gab0g000w0g2040Yh00s0goc9598wM040119421I8C80xNiBgggw1CKyZ10",
    "sperm"             : "m180098038000608040w00200084000w00400803000gxh4G4i0000k0M8040010w0040gwgg400wx000005g2",
    "moving_sierpinski" : "o8g3dGdhyUi020z0yeIwNpwh2m000BMubx4wlD48jM4gIw04W4h8oJ06qM4hAqQ5w0x024012N5as00ia9p000",
    "traffic_jam"       : "S-rZp-tStZRX-TP-ZStPXLuFY----CX-XH--XPL---TYLXvf..ndHr3-vv.ZZ-ZXZtOY-U--X--.-JZY-L-.X2",
    "settlers"          : ".7dDDsZ-XP3t.P---Zx.-LWvXH-v-XY--v-TT-Jf-TZLRLXTVLXZ-fB-L-V.n.m-Z--TLtvZvuFt-SDK.--.H3",
    "stabilizing_wave"  : "40w00o408k0a030oB0g245x00001g0Q1w0504A0k0M0108A001480008200oMwa0cw0kw090b4wk4bO2w00002",
    "unclear_death"     : "WXT---n-tv----vLTfXST-Q-Xr--v-T-K-D--Tv-.-----TnX.Z-L-ZXrTXL-tdL-.Wf--P-nTX--Tr-T-PGX3",
    "scatter"           : "snQXaX-a-G.--TYdTSHutft.FrDDfIZf-fSt-tYMQypbDrOVrsJQ-Dumr.KTTo-XD3UnA7tvYT-LVsDX-CJL.2",
    "race"              : "a00gMc44062gh0020640goa0E1K0gE08A0k00gw2g81g1820k23o1120gg0w108600080O48pxkgwyg32E1000",
};
/*
    inv bang:

    "triangle_to_grid"  : "QrehILZSPUZUvQKfbKRJPDXvTBYrRDe--.BvV-WvQZvp--.7vQKPfmCXhTnvG-.-hWvlZVmZZrPvLSL-iXP-T3",
    "growing_spark"     : "gP000w0wU00wc400604sibwgC-wc225M84i02yk10j05w12bma00e00gM4zzz0018k12Ek84ig03gg102g0iE0",
    
*/

const world = {
    width: 256,
    height: 256,
    tick: 0,
    history: null,
    tempLastMark: null,
    rule: conway,
};

const speeds = [
    1, 2, 5, 10, 25, 50, 100, 250, 500, 1000
];

let framecount = 0;
let tickcount = 0;
let ticksPerSec = 0;

let stepTimer = new Timer(() => {
    const ticksPerStep = ticksPerSec / 1000 * stepTimer.interval;
    step(ticksPerStep);
});
const minStepInterval = 1000 / 60; // ms

let gui;

// initialization
/*window.onload = */function init() {

    // init GUI
    gui = guiu.initElements(document, {
        // the canvas
        canvas: {
            event: {
                dblclick: pause,
            },
        },
        // outputs
        outTPS: {},
        outFPS: {},
        outTicksPerSec: {},        
        outTick: {},
        // inputs
        cbxFade         : fade, 
        edtRule: {},
        cbxSize: {},
        cbxInitial: {},
        nbrDensity: {},
        // buttons -> event handlers
        btnPause        : pause,
        btnTick         : () => step(1),
        btnPreviousMark : previousMark,
        btnNextMark     : nextMark,
        btnResetWorld   : reset,
        btnResetView    : resetView,
        btnMutate       : mutate,
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
    nbrDensity.value = 20;

    // init WebGL
    gl = glx.createContext(gui.canvas, 
        shaders["ca2d-vert"], shaders["ca2d-frag"],
        { antialias: false });
    gl.disable(gl.DEPTH_TEST);
    glx.setAttributes(gl, {
        a_position  : glx.rectangle(-1.0, -1.0, 2.0, 2.0),
        a_cellCoord : glx.rectangle( 0.0,  0.0, 1.0, 1.0), 
    });
    frameBuffer = gl.createFramebuffer();

    // create viewport for zooming and moving the canvas
    gui.viewPort = new ViewportControl(gui.canvas, changed);

    // update framerate every second
    setIntervalAndRun(() => {
        // get rid of "fractional ticks"
        tickcount = Math.round(tickcount);
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
    });

    // get initial values
    const params = getUrlParams();
    gui.cbxSize.value = params.size || world.width;
    gui.edtRule.value = params.rule || randomProperty(examples);

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

    gl.viewport(0, 0, gui.canvas.width, gui.canvas.height);

    glx.setUniforms(gl, {
        u_tick    : false,
        u_matrix  : gui.viewPort.matrix,
        u_world   : currentState,
    });        

    //draw to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    glx.draw(gl);
}

function step(ticks = 1) {

    gl.viewport(0, 0, world.width, world.height);

    glx.setUniforms(gl, {
        u_tick    : true,
        u_matrix  : m3.identity(),
        u_world   : currentState,
    });

    // lastState will receive output from fragment shader
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    // determine number of ticks considering last "fractional tick"
    const intTicks = Math.floor(ticks + tickcount % 1);

    for (let i = 0; i < intTicks; i++) {

        gl.bindTexture(gl.TEXTURE_2D, currentState);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lastState, 0);
        glx.draw(gl);

        // lastState is now our new currentState
        [currentState, lastState] = [lastState, currentState];

        // increase time
        setTick(world.tick + 1);

        // set a navigation mark every second
        if (world.tick % ticksPerSec == 0) {
            setMark();
        }

        tickcount++;
    }

    // remember "fractional tick"
    tickcount += ticks - intTicks;

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

function fade() {
    glx.setUniforms(gl, {
        u_fade: gui.cbxFade.checked
    });
}

class History {
    constructor(capacity) {
        this.states = new Map();
        this.ticks = new SortedArray();
        this.capacity = capacity;
        this.memoryUsage = 0; // bytes
        this.clear();
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

    // build initial state
    let init = new Uint32Array(world.width * world.height);
    if (cbxInitial.value == "bigbang") {
        init.fill(stateColors[0]);
        init[init.length/2 + world.width/2] = stateColors[1];
    } else if (cbxInitial.value == "invbang") {
        init.fill(stateColors[1]);
        init[init.length/2 + world.width/2] = stateColors[0];
    } else if (cbxInitial.value == "random") {
        const probability = 0.15;
        init = init.map(() => stateColors[Math.random() < probability ? 1 : 0]);
    } else {
        throw Error("Invalid initial state: " + cbxInitial.value);
    }

    // empty texture 
    lastState = glx.createTexture(gl, {
        src: null,
        width: world.width,
        height: world.height,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.REPEAT, // needs power of 2
    });
    // initial state
    currentState = glx.createTexture(gl, {
        src: init,
        width: world.width,
        height: world.height,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.REPEAT, // needs power of 2
    });

    // generate rule pixel data
    const rule = new Uint32Array(512);
    for (let i = 0; i < world.rule.length; i++) {
        rule[i] = stateColors[world.rule.array[i]];
    }

    glx.setUniforms(gl, {
        u_states  : world.rule.states,
        u_ruleSize: world.rule.length,
        u_worldSize: [world.width, world.height],
        u_rule: glx.createTexture(gl, {
            src: rule,
            width: rule.length,
            height: 1,
            min: gl.NEAREST,
            mag: gl.NEAREST,
            wrap: gl.CLAMP_TO_EDGE,
        }),
    });

    // big bang conditions
    setTick(0);

    // remember initial state
    setMark();

    // ready to render
    updateControls();
    updateTicksPerSec();
    changed();
}

function resetView() {
    gui.viewPort.reset();
}

function setCurrentState(data) {
    gl.bindTexture(gl.TEXTURE_2D, currentState);
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
    gui.edtRule.value = Rule.random(2, gui.nbrDensity.value).encode();
    reset();
}

function mutate() {
    const rule = Rule.decode(gui.edtRule.value);
    rule.mutate();
    gui.edtRule.value = rule.encode();
    reset();
}

function updateStatus() {
    gui.outTick.value = world.tick;
}

function updateTicksPerSec() {
    ticksPerSec = speeds[gui.rngSpeed.value];
    gui.outTicksPerSec.value = ticksPerSec + " tick/s";
    stepTimer.setInterval(Math.max(1000 / ticksPerSec, minStepInterval));
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
    return setInterval(handler, timeout);
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

function randomProperty(obj) {
    var keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
}

init();