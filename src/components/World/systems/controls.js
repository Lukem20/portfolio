import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Used for debugging purposes.
// Not used in the portfolio experience.

function createControls (camera, canvas) {
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;

    controls.tick = () => { controls.update() };

    return controls;
}

export { createControls }