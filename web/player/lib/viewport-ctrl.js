/* jshint esversion: 6 */

/**
 * This code is based on https://jsfiddle.net/greggman/mdpxw3n6/
 */

class ViewportControl {

	constructor(canvas, onchange) {
		this.canvas = canvas;
		this.onchange = null; // set below
		this.camera = null;

		// the view projection matrix and its inverse
		this.matrix = null;
		this.invMatrix = null;

		// state variables used during user operations
		this.startInvViewProjMat = null;
		this.startCamera = null;
		this.startPos = null;
		this.startClipPos = null;
		this.startMousePos = null;
		this.rotate = false;
		this.mouseDown = false;
		this.touchDistance = null;

		// setup event listeners
		this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
		window.addEventListener('mousemove', this.handleMouseMove.bind(this));
		window.addEventListener('mouseup', this.handleMouseUp.bind(this));
		this.canvas.addEventListener('wheel', this.handleMouseWheel.bind(this));
		window.addEventListener('resize', this.handleResize.bind(this));

		// touch related
		this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
		this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
		this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));

		// go to initial state
		this.reset();

		// set callback last to not trigger a change during initial reset
		this.onchange = onchange;
	}

	reset() {
		// reset camera
		this.camera = {
			x: 0,
			y: 0,
			rotation: 0,
			zoom: 1,
		};
		// reset aspect ratio
		this.canvas.width = this.canvas.clientWidth;
		this.canvas.height = this.canvas.clientHeight;		
		// done		
		this.changed();	
	}

	updateViewProjection() {
		// same as ortho(0, width, height, 0, -1, 1)
		const projectionMat = m3.identity();//m3.projection(gl.canvas.width, gl.canvas.height);
		const zoomScale = 1 / this.camera.zoom;
		let cameraMat = m3.identity();
		cameraMat = m3.translate(cameraMat, this.camera.x, this.camera.y);
		cameraMat = m3.rotate(cameraMat, this.camera.rotation);
		cameraMat = m3.scale(cameraMat, zoomScale, zoomScale);
		let viewMat = m3.inverse(cameraMat);
		this.matrix = m3.multiply(projectionMat, viewMat);
		this.invMatrix = m3.inverse(this.matrix);

		// the additional scaling may not intuitive (because simplified),
		// but basically keeps the aspect ratio when resizing the canvas
		// NOTE: this seems not to belong into the inverted matrix...
		const m = Math.min(this.canvas.width, this.canvas.height);
		this.matrix = m3.scale(this.matrix, m / this.canvas.clientWidth, m / this.canvas.clientHeight);
	}

	getClipSpaceMousePosition(clientX, clientY) {
		// get canvas relative css position
		const rect = this.canvas.getBoundingClientRect();
		const cssX = clientX - rect.left;
		const cssY = clientY - rect.top;

		// get normalized 0 to 1 position across and down canvas
		const normalizedX = cssX / this.canvas.clientWidth;
		const normalizedY = cssY / this.canvas.clientHeight;

		// convert to clip space
		const clipX = normalizedX * 2 - 1;
		const clipY = normalizedY * -2 + 1;

		return [clipX, clipY];
	}

	moveCamera(e) {
		const pos = m3.transformPoint(
			this.startInvViewProjMat,
			this.getClipSpaceMousePosition(e.clientX, e.clientY));

		this.camera.x = this.startCamera.x + this.startPos[0] - pos[0];
		this.camera.y = this.startCamera.y + this.startPos[1] - pos[1];

		this.changed();
	}

	handleMouseMove(e) {
		if (!this.mouseDown) {
			// nothing to do
			return;
		}
		if (this.rotate) {
			this.rotateCamera(e);
		} else {
			this.moveCamera(e);
		}
	}

	handleMouseUp(e) {
		if (!this.mouseDown) {
			// nothing to do
			return;
		}
		this.rotate = false;
		this.mouseDown = false;
		this.changed();
	}

	handleMouseDown(e) {
		e.preventDefault();
		this.mouseDown = true;

		this.rotate = e.shiftKey;
		this.startInvViewProjMat = this.invMatrix;
		this.startCamera = Object.assign({}, this.camera);
		this.startClipPos = this.getClipSpaceMousePosition(e.clientX, e.clientY);
		this.startPos = m3.transformPoint(
			this.startInvViewProjMat,
			this.startClipPos);
		this.startMousePos = [e.clientX, e.clientY];
		this.changed();
	}

	handleZoomEvent(clientX, clientY, factor) {
		const [clipX, clipY] = this.getClipSpaceMousePosition(clientX, clientY);

		// position before zooming
		const [preZoomX, preZoomY] = m3.transformPoint(
			this.invMatrix,
			[clipX, clipY]);

		// multiply the wheel movement by the current zoom level
		// so we zoom less when zoomed in and more when zoomed out
		const newZoom = this.camera.zoom * factor;
		this.camera.zoom = Math.max(0.02, Math.min(100, newZoom));

		this.updateViewProjection();

		// position after zooming
		const [postZoomX, postZoomY] = m3.transformPoint(
			this.invMatrix,
			[clipX, clipY]);

		// camera needs to be moved the difference of before and after
		this.camera.x += preZoomX - postZoomX;
		this.camera.y += preZoomY - postZoomY;

		this.changed();
	}

	handleMouseWheel(e) {
		e.preventDefault();
		this.handleZoomEvent(e.clientX, e.clientY, Math.pow(2, e.deltaY * -0.005));
	}

	getTouchDistance(e) {
		const x = e.touches[0].clientX - e.touches[1].clientX;
		const y = e.touches[0].clientY - e.touches[1].clientY;
		return Math.sqrt(x*x + y*y);
	}

	handleTouchStart(e) {
		console.debug("handleTouchStart", e);
		if (e.touches.length > 1) { 
			// handle multiple touch -> pinch zooming
			// Save current finger distance
			this.touchDistance = this.getTouchDistance(e);
		} else {
			// handle single touch -> moving around
			const touch = e.touches[0];
			this.startInvViewProjMat = this.invMatrix;
			this.startCamera = Object.assign({}, this.camera);
			this.startClipPos = this.getClipSpaceMousePosition(touch.clientX, touch.clientY);
			this.startPos = m3.transformPoint(
				this.startInvViewProjMat,
				this.startClipPos);
			this.startMousePos = [touch.clientX, touch.clientY];
			this.changed();			
		}
	}

	handleTouchEnd(e) {
		console.debug("handleTouchEnd", e);
		if (e.touches.length == 1) {
			// handle transition from multiple to single touch -> moving around
			const touch = e.touches[0];
			this.startInvViewProjMat = this.invMatrix;
			this.startCamera = Object.assign({}, this.camera);
			this.startClipPos = this.getClipSpaceMousePosition(touch.clientX, touch.clientY);
			this.startPos = m3.transformPoint(
				this.startInvViewProjMat,
				this.startClipPos);
			this.startMousePos = [touch.clientX, touch.clientY];
			this.changed();			
		}
	}

	handleTouchMove(e) {
		e.preventDefault(); // Stop the window from moving
		if (e.touches.length > 1) { 
			// handle multiple touch -> pinch zooming
			// get current finger distance
			const oldTouchDistance = this.touchDistance;
			this.touchDistance = this.getTouchDistance(e);
			// zoom into center
			const clientX = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
			const clientY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
			// zoom is proportional to change
			this.handleZoomEvent(clientX, clientY, Math.abs(this.touchDistance / oldTouchDistance)); 
		} else {
			// handle single touch -> moving around
			const touch = e.touches[0];
			this.moveCamera(touch);	
		}		
	}

	handleResize(e) {
		this.changed();
	}

	changed() {
		this.updateViewProjection();
		if (this.onchange) {
			this.onchange();
		}
	}
}
