"use strict";
import { 
    PerspectiveCamera,
    Clock,
} from 'three';

function createCamera() {
    const cursor = {
        x: 0,
        y: 0,
    };
    
    // Throttle mouse events to prevent Firefox spastic behavior
    let lastMouseUpdate = 0;
    const mouseThrottle = 8; // ~120fps

    window.addEventListener('mousemove', (event) => {
        const now = performance.now();

        if (now - lastMouseUpdate > mouseThrottle) {
            cursor.x = event.clientX / window.innerWidth - 0.5;
            cursor.y = event.clientY / window.innerHeight - 0.5;
            lastMouseUpdate = now;
        }
    });
    

    const camera = new PerspectiveCamera(
        60, window.innerWidth / window.innerHeight, 0.1, 1000
    );

    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 130;


    const clock = new Clock();
    let previousTime = 0;

    camera.tick = () => {
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = elapsedTime - previousTime;
        previousTime = elapsedTime;

        const parallaxX = cursor.x * 10;
        const parallaxY = - cursor.y * 10;

        const lerpFactor = Math.min(deltaTime * 2, 0.016); // ~60fps

        camera.position.x += (parallaxX - camera.position.x) * lerpFactor;
        camera.position.y += (parallaxY - camera.position.y) * lerpFactor;
    }

    return camera;
}

export { createCamera }