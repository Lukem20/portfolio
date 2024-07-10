import { 
    PerspectiveCamera,
    Clock,
    Group 
} from 'three';

function createCamera() {
    const cursor = {
        x: 0,
        y: 0,
    };
    
    window.addEventListener('mousemove', (event) => {
        cursor.x = event.clientX / window.innerWidth - 0.5;
        cursor.y = event.clientY / window.innerHeight - 0.5;
    });
    
    const camera = new PerspectiveCamera(
        60, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    camera.position.z = 120;

    const cameraGroup = new Group();
    cameraGroup.add(camera);

    const clock = new Clock();
    let previousTime = 0;

    camera.tick = (delta) => {
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = elapsedTime - previousTime;
        previousTime = elapsedTime;

        const parallaxX = cursor.x * 0.5;
        const parallaxY = - cursor.y * 0.5;
        cameraGroup.position.x += (parallaxX - camera.position.x) * 5 * deltaTime;
        cameraGroup.position.y += (parallaxY - camera.position.y) * 5 * deltaTime;
    }

    return cameraGroup;
}

export { createCamera }