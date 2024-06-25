import { PerspectiveCamera } from 'three';

/**
 * TODO
 * 1. Add parallax experience from threejs-scrollAnimations project.
 *  
 */

function createCamera() {
    const camera = new PerspectiveCamera(
        60, window.innerWidth / window.innerHeight, 0.1, 1000
    );

    camera.position.z = 110;

    return camera;
}

export { createCamera }