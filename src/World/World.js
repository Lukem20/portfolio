// Components
import { createCamera } from './components/camera.js';
import { createLights } from './components/lights.js';
import { createScene } from './components/scene.js';
import { createPhotos } from './components/photoWheels.js';

// Systems
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';

let camera;
let renderer;
let scene;
let loop;

class World {
    constructor(container) {
        const cameraGroup = createCamera();
        camera = cameraGroup.children[0];
        renderer = createRenderer();
        scene = createScene();
        loop = new Loop(camera, scene, renderer);
        container.append(renderer.domElement);

        const ambientLight = createLights();
        const photoWheels = createPhotos(camera, container);

        scene.add(photoWheels, camera, ambientLight);
        loop.updatables.push(camera);
        loop.updatables.push(photoWheels);

        const resizer = new Resizer(container, camera, renderer);
    }

    render() {
        renderer.render(scene, camera);
    }
    start() {
        loop.start();
    }
    stop() {
        loop.stop();
    }
}
    
export { World };