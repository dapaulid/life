/* jshint esversion: 6 */

var gl;
var currentState;
var lastState;
var frameBuffer;

function ci(state, label) {
    return state | (label << 5);
}

const stateColors = [
    color(0x00, 0x00, 0x00, ci(0, 0)),
    color(0xFF, 0xFF, 0xFF, ci(1, 0)),
];

const LABEL_COLORS = [
    [255, 255, 255, ci(0, 0)], // white
    [255,   0,   0, ci(0, 1)], // red
    [  0, 128,   0, ci(0, 2)], // green
    [255, 165,   0, ci(0, 3)], // orange
    [128,   0, 128, ci(0, 4)], // purple
    [210, 105,  30, ci(0, 5)], // brown (chocolate)
    [255, 255,   0, ci(0, 6)], // yellow
    [255, 192, 203, ci(0, 7)], // pink
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
    "creatures"         : "oVvoZL-jJ-5vZ.tKNTTvQ-FZJTFuRRZLWrvvEnTDInIrXLjDReVH-JWKQn7f-W-T.nZ-SXTHoA.ZvVR-XZIML3",
    "cool_fade"         : "w0a264105jgh0Q0jg2000380U89gab0g000w0g2040Yh00s0goc9598wM040119421I8C80xNiBgggw1CKyZ10",
    "sperm"             : "m180098038000608040w00200084000w00400803000gxh4G4i0000k0M8040010w0040gwgg400wx000005g2",
    "moving_sierpinski" : "o8g3dGdhyUi020z0yeIwNpwh2m000BMubx4wlD48jM4gIw04W4h8oJ06qM4hAqQ5w0x024012N5as00ia9p000",
    "traffic_jam"       : "S-rZp-tStZRX-TP-ZStPXLuFY----CX-XH--XPL---TYLXvf..ndHr3-vv.ZZ-ZXZtOY-U--X--.-JZY-L-.X2",
    "settlers"          : ".7dDDsZ-XP3t.P---Zx.-LWvXH-v-XY--v-TT-Jf-TZLRLXTVLXZ-fB-L-V.n.m-Z--TLtvZvuFt-SDK.--.H3",
    "stabilizing_wave"  : "40w00o408k0a030oB0g245x00001g0Q1w0504A0k0M0108A001480008200oMwa0cw0kw090b4wk4bO2w00002",
    "unclear_death"     : "WXT---n-tv----vLTfXST-Q-Xr--v-T-K-D--Tv-.-----TnX.Z-L-ZXrTXL-tdL-.Wf--P-nTX--Tr-T-PGX3",
    "scatter"           : "snQXaX-a-G.--TYdTSHutft.FrDDfIZf-fSt-tYMQypbDrOVrsJQ-Dumr.KTTo-XD3UnA7tvYT-LVsDX-CJL.2",
    "race"              : "a00gMc44062gh0020640goa0E1K0gE08A0k00gw2g81g1820k23o1120gg0w108600080O48pxkgwyg32E1000",
    "sand"              : "2aM000e00wg088wp10wgy0yi11xw0wF04y8g00g8f50ag021x1pmw62004wp4A80aM0Ma1y40g1g00b03cq0a0",
};
/*
    inv bang:

    "triangle_to_grid"  : "QrehILZSPUZUvQKfbKRJPDXvTBYrRDe--.BvV-WvQZvp--.7vQKPfmCXhTnvG-.-hWvlZVmZZrPvLSL-iXP-T3",
    "growing_spark"     : "gP000w0wU00wc400604sibwgC-wc225M84i02yk10j05w12bma00e00gM4zzz0018k12Ek84ig03gg102g0iE0",
    
*/

const default_config = {
    size: 256,
    initial: 'bigbang',
    rule: examples.creatures,
};

const default_settings = {
    fade: true,
    speed: 5, // index
};

const world = {
    config: null,
    width: null,
    height: null,
    rule: null,
    tick: 0,
    history: null,
    tempLastMark: null,
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
                click   : handleClick,
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
        btnZoomIn       : zoomIn,
        btnZoomOut      : zoomOut,
        btnResetView    : resetView,
        btnMutate       : mutate,
        btnInvert       : invert,
        btnRandom       : random,
        btnLabel        : labelPatterns,
        btnSaveWorld    : saveWorld,
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

    // handle persistent settings
    const settings = guiu.loadSettings();
    gui.rngSpeed.value = settings.speed;
    gui.cbxFade.checked = settings.fade;
    fade();


    window.addEventListener('beforeunload', () => {
        const settings = {};
        settings.speed = gui.rngSpeed.value;
        settings.fade = gui.cbxFade.checked;
        guiu.saveSettings(settings);
    });

    // read configuration from URL
    world.config = getUrlParams(default_config);
    gui.cbxSize.value =  Math.min(world.config.size, maxSize);
    gui.cbxInitial.value = world.config.initial;
    gui.edtRule.value = world.config.rule;

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
        // render a frame
        render();
        framecount++;
        // allow further render requests
        animate = null;
    });
}

function render(){

    // call resize handler for viewport,
    // as clientWIdth/height may sporadically change without resize event
    gui.viewPort.handleResize();

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

function encodeCell(cell) {
    let x = 0x00000000;
    x |= (cell.color[0] & 0xFF);
    x |= (cell.color[1] & 0xFF) << 8;
    x |= (cell.color[2] & 0xFF) << 16;
    x |= (cell.state & 0x1F) << 24;
    x |= (cell.label & 0x07) << 29;
    return x;
}

function decodeCell(x) {
    const cell = {};
    cell.state = (x >> 24) & 0x1F;
    cell.label = (x >> 29) & 0x07;
    cell.color = [
        x & 0xFF,
        (x >> 8) & 0xFF,
        (x >> 16) & 0xFF,
    ];
    return cell;
}

function posToIndex(pos) {
    const x = pos[0] & (world.width - 1);
    const y = pos[1] & (world.height - 1);
    return x + world.width * y;
}

function indexToPos(i) {
   return [i % world.width, i / world.width];
}

function floodFill(cells, startPos, label) {

    const startIndex = posToIndex(startPos);
    const cell = decodeCell(cells[startIndex]);
    const oldLabel = cell.label;

    const color = LABEL_COLORS[label];
    const newCell = color[0] | (color[1] << 8) | (color[2] << 16) | (label << 29);


    let count = 0;
    const queue = [];
    for (let index = startIndex; index != null; index = queue.pop()) {
        let cell = cells[index];
        if (((cell & 0x1F000000) !== 0) && ((cell & 0xE0000000) === 0)) {
            cells[index] = newCell | (cell & 0x1F000000);
            count++;
            const pos = indexToPos(index);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx || dy) {
                        queue.push(posToIndex([pos[0] + dx, pos[1] + dy]));
                    }
                }   
            }
        }
    }

    return count;
}

function labelPatterns() {
    numPatterns = 0;

    let state = getCurrentState();

    const startTime = performance.now();
    let nextLabel = 2;
    for (let i = 0; i < state.length; i++) {
        const cell = state[i];
        if (((cell & 0x1F000000) != 0) && ((cell & 0xE0000000) == 0)) {
            const count = floodFill(state, indexToPos(i), nextLabel);
            if (count > 0) {
                numPatterns++;
                nextLabel = (nextLabel - 2 + 1) % 6 + 2;
            }
        }
    }
    console.debug("Labeled " + numPatterns + " patterns in " + (performance.now() - startTime) + " ms");    
    setCurrentState(state);

    changed();
}

function handleClick(e) {
    if (gui.viewPort.inputHandled) {
        // not for us
        return;
    }

    const m = Math.min(gui.canvas.clientWidth, gui.canvas.clientHeight);

    let pos = gui.viewPort.translate([e.clientX, e.clientY]);
    pos[0] *= gui.canvas.clientWidth / m;
    pos[1] *= gui.canvas.clientHeight / m;
    if (pos[0] < -1.0 || pos[0] > 1.0 || pos[1] < -1.0 || pos[1] > 1.0) {
        // outside
        return;
    }
    pos[0] = Math.floor((pos[0] + 1) * 0.5 * world.width);
    pos[1] = Math.floor((pos[1] + 1) * 0.5 * world.height);

    let state = getCurrentState();
    const count = floodFill(state, pos, 1);
    if (count > 0) {
        changed();
    }
    console.debug("Filled pixels:", count);
    /*
    let index = pos[1] * world.width + pos[0];
    console.debug("setting pixel at " + pos + " -> index " + index);
    let cell = decodeCell(state[index]);
    console.debug(cell);
    if (cell.state != 0) {
        cell.label = nextLabel;
        nextLabel = (nextLabel + 1) % 7 + 1;
    }
    state[index] = encodeCell(cell);
    */
    setCurrentState(state);
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

    // update world config from GUI
    world.config = {};
    world.config.size = gui.cbxSize.value;
    world.config.rule = gui.edtRule.value;
    world.config.initial = gui.cbxInitial.value;
    setUrlParams(world.config);

    // initialize world state from config
    world.width = world.config.size;
    world.height = world.config.size;
    world.rule = Rule.decode(world.config.rule);
    world.history = new History(1024*1024*100);
    world.tempLastMark = null;

    // build initial state
    let init = new Uint32Array(world.width * world.height);
    if (world.config.initial == "bigbang") {
        init.fill(stateColors[0]);
        init[init.length/2 + world.width/2] = stateColors[1];
    } else if (world.config.initial == "invbang") {
        init.fill(stateColors[1]);
        init[init.length/2 + world.width/2] = stateColors[0];
    } else if (world.config.initial == "random") {
        const probability = 0.15;
        init = init.map(() => stateColors[Math.random() < probability ? 1 : 0]);
    } else {
        throw Error("Invalid initial state: " + world.config.initial);
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

/*
    convolution kernel:

	 4 | 3 | 2
	---+---+---
	 5 | 0 | 1
	---+---+---
	 6 | 7 | 8

*/
    const [dx, dy] = [1.0 / world.width, 1.0 / world.height];
    const neighCoord = [
         0.0 * dx,  0.0 * dy,
         1.0 * dx,  0.0 * dy,
         1.0 * dx,  1.0 * dy,
         0.0 * dx,  1.0 * dy,
        -1.0 * dx,  1.0 * dy,
        -1.0 * dx,  0.0 * dy,
        -1.0 * dx, -1.0 * dy,
         0.0 * dx, -1.0 * dy,
         1.0 * dx, -1.0 * dy,
    ];

    glx.setUniforms(gl, {
        u_states  : world.rule.states,
        u_ruleSize: world.rule.length,
        u_neighCoord: neighCoord,
        u_labelColors: glx.colorToVec4(LABEL_COLORS),
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

function zoomIn() {
    gui.viewPort.zoom(2.0);
}

function zoomOut() {
    gui.viewPort.zoom(0.5);
}

function resetView() {
    gui.viewPort.reset();
}

function setCurrentState(data) {
    gl.bindTexture(gl.TEXTURE_2D, currentState);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
        world.width, world.height, 0, gl.RGBA, 
        gl.UNSIGNED_BYTE, new Uint8Array(data.buffer));
    changed();
}

function getCurrentState() {
    let data = new Uint8Array(world.width * world.height * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentState, 0);
    gl.readPixels(0, 0, world.width, world.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return new Uint32Array(data.buffer);
}

function random() {
    gui.edtRule.value = Rule.random(2, gui.nbrDensity.value || null).encode();
    reset();
}

function mutate() {
    const rule = Rule.decode(gui.edtRule.value);
    rule.mutate();
    gui.edtRule.value = rule.encode();
    reset();
}

function invert() {
    const rule = Rule.decode(gui.edtRule.value).inverted();
    gui.edtRule.value = rule.encode();
    if (gui.cbxInitial.selectedIndex == 0) {
        gui.cbxInitial.selectedIndex = 1;
    } else if (gui.cbxInitial.selectedIndex == 1) {
        gui.cbxInitial.selectedIndex = 0;
    }
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
        gui.rngTick.disabled = false;
    } else {
        // initial position: make slider appear on the right
        gui.rngTick.max = 1;
        gui.rngTick.value = 1;
        gui.rngTick.disabled = true;
    }
}

function setTick(tick) {
    world.tick = tick;

    if (world.tick == Math.max(world.width, world.height) / 2) {
        labelPatterns();
    }
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

function downloadObjectAsJson(exportObj, exportName){
    const json = JSON.stringify(exportObj, null, 2);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(json);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

function saveWorld() {
    downloadObjectAsJson(world.config, world.config.rule);
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

function getUrlParams(defaults) {
    const params = Object.assign({}, defaults);
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