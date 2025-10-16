import { WHEEL_CONFIG } from '../config.js';
import {
    Mesh,
} from 'three';

function createMesh(geometry, material, name, position) {
    const mesh = new Mesh(geometry, material);
    mesh.name = name
    mesh.position.set(
        Math.cos(WHEEL_CONFIG.RADIAN_INTERVAL * position) * WHEEL_CONFIG.RADIUS,
        Math.sin(WHEEL_CONFIG.RADIAN_INTERVAL * position) * WHEEL_CONFIG.RADIUS,
        1
    );

    mesh.userData.originalPosition = mesh.position.clone();

    return mesh;
}

export { createMesh }