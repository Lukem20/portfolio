import { MeshStandardMaterial } from 'three';

function createMaterial (texture) {    
    return new MeshStandardMaterial({ 
        map: texture,
        transparent: true,
        opacity: 1
    });
}

export { createMaterial }