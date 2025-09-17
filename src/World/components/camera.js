import { 
    PerspectiveCamera,
    Clock,
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

    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 120;


    const clock = new Clock();
    let previousTime = 0;

    camera.tick = () => {
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = elapsedTime - previousTime;
        previousTime = elapsedTime;

        const parallaxX = cursor.x * 5;
        const parallaxY = - cursor.y * 5;
        camera.position.x += (parallaxX - camera.position.x) * 100 * deltaTime;
        camera.position.y += (parallaxY - camera.position.y) * 100 * deltaTime;

        console.log('x: ', camera.position.x);
        console.log('y: ', camera.position.y);

    }

    return camera;
}

export { createCamera }