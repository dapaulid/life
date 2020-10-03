'use strict';

class ViewportControl {

	constructor(canvas, onchange) {
		this.canvas = canvas;
		this.onchange = onchange || function () { };
		this.camera = {
			x: 0,
			y: 0,
			rotation: 0,
			zoom: 1,
		};
		// the view projection matrix and its inverse
		this.matrix = null;
		this.invMatrix = null;
		this.updateViewProjection();

		// state variables used during user operations
		this.startInvViewProjMat = null;
		this.startCamera = null;
		this.startPos = null;
		this.startClipPos = null;
		this.startMousePos = null;
		this.rotate = false;
		this.mouseDown = false;

		// setup event listeners
		this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
		window.addEventListener('mousemove', this.handleMouseMove.bind(this));
		window.addEventListener('mouseup', this.handleMouseUp.bind(this));
		this.canvas.addEventListener('wheel', this.handleMouseWheel.bind(this));
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
	}

	getClipSpaceMousePosition(e) {
		// get canvas relative css position
		const rect = this.canvas.getBoundingClientRect();
		const cssX = e.clientX - rect.left;
		const cssY = e.clientY - rect.top;

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
			this.getClipSpaceMousePosition(e));

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
		this.startClipPos = this.getClipSpaceMousePosition(e);
		this.startPos = m3.transformPoint(
			this.startInvViewProjMat,
			this.startClipPos);
		this.startMousePos = [e.clientX, e.clientY];
		this.changed();
	}

	handleMouseWheel(e) {
		e.preventDefault();
		const [clipX, clipY] = this.getClipSpaceMousePosition(e);

		// position before zooming
		const [preZoomX, preZoomY] = m3.transformPoint(
			this.invMatrix,
			[clipX, clipY]);

		// multiply the wheel movement by the current zoom level
		// so we zoom less when zoomed in and more when zoomed out
		const newZoom = this.camera.zoom * Math.pow(2, e.deltaY * -0.01);
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

	changed() {
		this.updateViewProjection();
		this.onchange();
	}
}
