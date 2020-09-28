STATES = 2;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var world = {
    radius: 100,
}
world.size = world.radius * 2 + 1;
world.area = world.size**2;
world.rule = Array(STATES**9).fill(0);
//world.rule[2] = 1
//world.rule[32] = 1

// ticks per update
step = 1
paused = false;

function randomize_rule()
{
    for (let i = 0; i < world.rule.length; i++) {
        world.rule[i] = Math.random() > 0.85 ? 1 : 0;//Math.floor(Math.random() * STATES); 
    }
    // no flicker-style worlds
    world.rule[0] = 0;
}
randomize_rule();

//              empty      alive
//cell_styles = ["#FFFFD5", "black", "red"]
cell_styles = ["black", "yellow", "red"]

show_coords = false;

world.coord_to_index = function(x, y)
{

    x += world.radius;
    y += world.radius;    

    x %= world.size;
    y %= world.size;

    if (x < 0) x += world.size;
    if (y < 0) y += world.size;    

    return y * world.size + x;
};
world.get_cell = function(x, y)
{
    const i = world.coord_to_index(x, y);
    const v = world.cells[i];
    return v;
};
world.set_cell = function(x, y, v)
{
    const i = world.coord_to_index(x, y);
    if (v == null) {
        console.log(v, i, x, y);
    }  
    world.cells[i] = v;
};
world.get_ni = function(x, y)
{
    // 4 3 2
    // 5 0 1
    // 6 7 8

    let ni = 0;
    ni += world.get_cell(x, y) * STATES**0;
    ni += world.get_cell(x+1, y) * STATES**1;
    ni += world.get_cell(x+1, y+1) * STATES**2;
    ni += world.get_cell(x, y+1) * STATES**3;
    ni += world.get_cell(x-1, y+1) * STATES**4;
    ni += world.get_cell(x-1, y) * STATES**5;
    ni += world.get_cell(x-1, y-1) * STATES**6;
    ni += world.get_cell(x, y-1) * STATES**7;
    ni += world.get_cell(x+1, y-1) * STATES**8;
    return ni;
}
world.tick = function() {
    world.population = Array(STATES).fill(0)
    // overwrite old cells
    const new_cells = world.old_cells;
    const t0 = performance.now();
    // determine next state for each cell
    for (let x = -world.radius; x <= world.radius; x++) {
        for (let y = -world.radius; y <= world.radius; y++) {
            const ni = world.get_ni(x, y);
            // update cell for next tick
            const i = world.coord_to_index(x, y)
            const v = world.rule[ni];
            new_cells[i] = v;
            // update statistics
            world.population[v]++;
        }
    }
    world.tick_time = performance.now() - t0;
    // commit cells
    world.old_cells = world.cells;
    world.cells = new_cells
    // normalize statistics
    for (let i = 0; i < world.population.length; i++) {
        world.population[i] /= world.area;
    }
    // update time
    world.time++;
}

function draw() {
    const ts = Math.min(canvas.width, canvas.height) / world.size
    // cells
    for (let vx = 0; vx < world.size; vx++) {
        for (let vy = 0; vy < world.size; vy++) {
            const x = vx - world.radius;
            const y = -(vy - world.radius);
            const v = world.get_cell(x, y);
            ctx.fillStyle = cell_styles[v]
            ctx.fillRect(vx*ts, vy*ts, ts, ts);
            if (show_coords) {
                ctx.fillStyle = cell_styles[1-v]           
                ctx.textAlign  = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("("+x+"|"+y+")", vx*ts + ts/2, vy*ts + ts/2);
            }
        }
    }
    // grid
    return;
    ctx.beginPath()
    for (let i = 0; i <= world.size; i++) {
        const l = i*ts;
        // vertical lines
        ctx.moveTo(l, 0);   
        ctx.lineTo(l, canvas.height);
        // horizontal lines
        ctx.moveTo(0, l);   
        ctx.lineTo(canvas.width, l);    
    }
    ctx.stroke();    
}

world.reset = function()
{
    world.cells = Array(world.size**2).fill(0)
    world.old_cells = Array(world.size**2).fill(0)
    world.population = Array(STATES).fill(0)
    world.time = 0;
    // big bang seed
    world.set_cell(0, 0, 1);
    draw();
}

world.save = function(name) {
    const state = {
        rule: world.rule
    }
    localStorage.setItem("world." + name, JSON.stringify(state));
}

world.load = function(name) {
    const state = JSON.parse(localStorage.getItem("world." + name));
    world.rule = state.rule;
    world.reset();
    draw();
}

world.list = function() {
    let list = [];
    for (let i = 0; i < localStorage.length; i++) {
        let item = localStorage.key(i);
        let path = item.split(".");
        if (path[0] == "world") {
            list.push(path[1]);
        }
    }
    return list;
}

var worlds = world.list();
var current = null;
world.next = function() {
    current = current != null ? (current + 1) % worlds.length : 0;
    world.load(worlds[current]);
    return worlds[current];
}



function pause() {
    paused = !paused;
}

function tick() {

    for (let i = 0; i < step; i++) {
        world.tick()
    }
    console.log("Tick: " + world.time + ", alive: " + Math.round(world.population[1] * 100) + "%, took " + world.tick_time + " ms");
    draw();
    //console.log("tick");
}

function advance(world_time) {
    while (world.time < world_time-1) {
        world.tick();
    }
    tick();
}

function handle_interval()
{
    if (paused) return;
    tick();    
}


function find_world() {
    let counter = 0;
    while (1) {
        randomize_rule();
        world.reset();
        for (let i = 0; i < 200; i++) {
            world.tick();
        }
        counter++;
        console.log("World " + counter);
        if ((world.population[1] > 0.10) && (world.population[1] < 0.30)) {
            break;
        }
    }
}

//find_world();

world.reset();
draw();
setInterval(handle_interval, 100);
