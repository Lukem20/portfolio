import { AmbientLight } from 'three';

function createLights() {
    return new AmbientLight('#ffffff', 3);
}

export { createLights };