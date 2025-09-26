// Components
import { createCamera } from './components/camera.js';
import { createLights } from './components/lights.js';
import { createScene } from './components/scene.js';
import { createBackground } from './components/background.js';
import { createPhotos } from './components/photoWheels.js'
// import { PhotoWheels } from './components/PhotoWheels/PhotoWheels.js';

// Systems
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';

let camera;
let renderer;
let scene;
let loop;
let photoWheels;

class World {
    constructor(container) {
        camera = createCamera();
        renderer = createRenderer();
        scene = createScene();
        loop = new Loop(camera, scene, renderer);
        container.append(renderer.domElement);

        const background = createBackground();
        const lights = createLights(scene);
        
        // photoWheels = new PhotoWheels(camera, container);
        photoWheels = createPhotos(camera, container, lights);
        photoWheels.setupWebGL(renderer);

        scene.add(lights);
        scene.add(photoWheels, camera, background);

        loop.updatables.push(camera);
        loop.updatables.push(photoWheels);
        for (const light of lights.children) loop.updatables.push(light);

        const resizer = new Resizer(container, camera, renderer);
    }

    render() {
        renderer.render(scene, camera);
    }
    dispose() {
        if (photoWheels) {
            photoWheels.cleanup();
        }
    }
    start() {
        loop.start();
    }
    stop() {
        loop.stop();
    }
}
    
export { World };