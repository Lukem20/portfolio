import { AmbientLight } from 'three';

function createLights() {
    return new AmbientLight('#b9d5ff', 1);
}

export { createLights };