"use strict";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function createControls (camera, canvas) {
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    controls.tick = () => { controls.update() };

    return controls;
}

export { createControls }