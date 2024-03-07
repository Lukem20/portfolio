// Components
import { createCamera } from './components/camera.js';
import { createLights } from './components/lights.js';
import { createScene } from './components/scene.js';
import { createPhotos } from './components/photoWheels.js';

// Systems
import { createRenderer } from './systems/renderer.js';
import { createControls } from './systems/controls.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';

let camera;
let renderer;
let scene;
let loop;
let controls;

class World {
    constructor(container) {
        /* Base scene */
        camera = createCamera();
        renderer = createRenderer();
        scene = createScene();
        loop = new Loop(camera, scene, renderer);
        container.append(renderer.domElement);

        /* Lights */
        const ambientLight = createLights();
        scene.add(ambientLight);

        /* Image wheel gallery */
        const photoWheels = createPhotos();
        scene.add(photoWheels);

        /* Controls */
        controls = createControls(camera, container);
        controls.addEventListener('change', () => {
            this.render();
        });

        /* Window resize */
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