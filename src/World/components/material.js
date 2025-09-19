import { MeshStandardMaterial } from 'three';

function createMaterial (texture) {    
    return new MeshStandardMaterial({ 
        map: texture,
        transparent: true,
        opacity: 1,
        roughness: 0.5,
        metalness: 0.1,
    });
}

export { createMaterial }