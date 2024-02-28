import { PerspectiveCamera } from 'three';

/**
 * TODO
 * 1. Add parallax experience from threejs-scrollAnimations project.
 *  
 */

function createCamera() {
    const camera = new PerspectiveCamera(
        75, 1, 1, 500
    );

    camera.position.z = 175;

    return camera;
}

export { createCamera }