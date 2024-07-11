import { AmbientLight } from 'three';

function createLights() {
    const light = new AmbientLight(0xffffff, 3.14);

    return light;
}

export { createLights };