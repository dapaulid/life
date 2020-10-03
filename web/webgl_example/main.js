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
var textureSizeLocation;
var mouseCoordLocation;

var programInfo

var paused = false;//while window is resizing

let viewProjectionMat;

window.onload = initGL;

function initGL() {

    // Get A WebGL context
    canvas = document.getElementById("glcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // TODO for zooming and moving see
    // https://jsfiddle.net/greggman/mdpxw3n6/

    //canvas.onmousemove = onMouseMove;
    //canvas.ontouchmove = onTouchMove;

    window.onresize = onResize;

    gl = twgl.getWebGLContext(canvas, { antialias: false });
    if (!gl) {
        alert('Could not initialize WebGL, try another browser');
        return;
    }

    //setpixelated(canvas.getContext('2d'));
    //function setpixelated(context){
    //    context['imageSmoothingEnabled'] = false;       /* standard */
    //    context['mozImageSmoothingEnabled'] = false;    /* Firefox */
    //    context['oImageSmoothingEnabled'] = false;      /* Opera */
    //    context['webkitImageSmoothingEnabled'] = false; /* Safari */
    //    context['msImageSmoothingEnabled'] = false;     /* IE */
    //}

    gl.disable(gl.DEPTH_TEST);

    // setup a GLSL program
    programInfo = twgl.createProgramInfo(gl, 
        [shaders["2d-vertex"], shaders["2d-fragment"]],
        null, null,
        err => { throw "TWGL error:\n" + err }
    );
    var program = programInfo.program;
    
    gl.useProgram(program);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");

    // Create a buffer for positions
    var bufferPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferPos);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0]), gl.STATIC_DRAW);


    //flip y
    flipYLocation = gl.getUniformLocation(program, "u_flipY");

    //set texture location
    var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

    textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    mouseCoordLocation = gl.getUniformLocation(program, "u_mouseCoord");

    // provide texture coordinates for the rectangle.
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    initControls();

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
        let mat = m3.identity();
        //mat = m3.translate(mat, x, y);
        //mat = m3.rotate(mat, rotation);
        //mat = m3.scale(mat, scale, scale);
        
        //updateViewProjection();

        //mat = m3.multiply(viewProjectionMat, mat);
        //mat = m3.translate(mat, 0.01, 0.01);
        //mat = m3.scale(mat, x, x);

        const zoomScale = 1 / camera.zoom;
        mat = m3.scale(mat, zoomScale, zoomScale);
        mat = m3.translate(mat, camera.x, camera.y);
        //console.log(camera.x, camera.y)

        updateViewProjection();
        //console.log(viewProjectionMat);
        mat = viewProjectionMat;

        // calls gl.uniformXXX

        
        // don't y flip images while drawing to the textures
        gl.uniform1f(flipYLocation, 1);
        twgl.setUniforms(programInfo, {
            u_matrix: m3.identity(),
          });

        step();


        gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas
        twgl.setUniforms(programInfo, {
            u_matrix: mat,
        });        
        gl.bindTexture(gl.TEXTURE_2D, lastState);



        //draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, lastState);
        gl.drawArrays(gl.TRIANGLES, 0, 6);


    }



    window.requestAnimationFrame(render);
}

function step(){
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentState, 0);

    gl.bindTexture(gl.TEXTURE_2D, lastState);

    gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer

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
    //fill with random pixels
    var rgba = new Uint8Array(width*height*4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, makeRandomArray(rgba));

    paused = false;
}

function onMouseMove(e){
    gl.uniform2f(mouseCoordLocation, e.clientX/width, e.clientY/height);
}

function onTouchMove(e){
    e.preventDefault();
    var touch = e.touches[0];
    gl.uniform2f(mouseCoordLocation, touch.pageX/width, touch.pageY/height);
}

////////////////////////// CONTROL STUFF //////////////////////////

const camera = {
    x: 0,
    y: 0,
    rotation: 0,
    zoom: 1,
  };

function makeCameraMatrix() {
    const zoomScale = 1 / camera.zoom;
    let cameraMat = m3.identity();
    cameraMat = m3.translate(cameraMat, camera.x, camera.y);
    cameraMat = m3.rotate(cameraMat, camera.rotation);
    cameraMat = m3.scale(cameraMat, zoomScale, zoomScale);
    return cameraMat;
  }
  
  function updateViewProjection() {
    // same as ortho(0, width, height, 0, -1, 1)
    const projectionMat = m3.identity();//m3.projection(gl.canvas.width, gl.canvas.height);
    const cameraMat = makeCameraMatrix();
    let viewMat = m3.inverse(cameraMat);
    viewProjectionMat = m3.multiply(projectionMat, viewMat);
  }

function initControls() {

updateViewProjection();



function getClipSpaceMousePosition(e) {
    // get canvas relative css position
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    
    // get normalized 0 to 1 position across and down canvas
    const normalizedX = cssX / canvas.clientWidth;
    const normalizedY = cssY / canvas.clientHeight;
  
    // convert to clip space
    const clipX = normalizedX *  2 - 1;
    const clipY = normalizedY * -2 + 1;
    
    return [clipX, clipY];
  }
  
  let startInvViewProjMat;
  let startCamera;
  let startPos;
  let startClipPos;
  let startMousePos;
  let rotate;
  
  function moveCamera(e) {
    const pos = m3.transformPoint(
              startInvViewProjMat,
        getClipSpaceMousePosition(e)); // TODO something else?
    //const pos =   getClipSpaceMousePosition(e)
      
    camera.x = startCamera.x + startPos[0] - pos[0];
    camera.y = startCamera.y + startPos[1] - pos[1];
    draw();
  }

  function handleMouseMove(e) {
    if (rotate) {
          rotateCamera(e);
    } else {
      moveCamera(e);
    }
  }
  
  function handleMouseUp(e) {
    rotate = false;
    draw();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
  }
  
  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
  
    rotate = e.shiftKey;
    startInvViewProjMat = m3.inverse(viewProjectionMat);
    startCamera = Object.assign({}, camera);
    startClipPos = getClipSpaceMousePosition(e);
    startPos = m3.transformPoint(
              startInvViewProjMat,
        startClipPos); // TODO
    //console.log(startPos)
    startMousePos = [e.clientX, e.clientY];
    draw();
  })

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();  
    const [clipX, clipY] = getClipSpaceMousePosition(e);
    
    // position before zooming
    const [preZoomX, preZoomY] = m3.transformPoint(
        m3.inverse(viewProjectionMat), 
        [clipX, clipY]);
      
    // multiply the wheel movement by the current zoom level
    // so we zoom less when zoomed in and more when zoomed out
    const newZoom = camera.zoom * Math.pow(2, e.deltaY * -0.01);
    camera.zoom = Math.max(0.02, Math.min(100, newZoom));
    
    updateViewProjection();
    
    // position after zooming
    const [postZoomX, postZoomY] = m3.transformPoint(
        m3.inverse(viewProjectionMat), 
        [clipX, clipY]);
  
    // camera needs to be moved the difference of before and after
    camera.x += preZoomX - postZoomX;
    camera.y += preZoomY - postZoomY;  
    
    draw();
  });  

  function draw() {
    updateViewProjection();
    //render();
  }

} // initControls