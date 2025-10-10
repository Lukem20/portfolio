// Systems
import { createScene } from '../systems/scene.js';
import { createRenderer } from '../systems/renderer.js';
import { Resizer } from '../systems/Resizer.js';
import { Loop } from '../systems/Loop.js';

let renderer;
let scene;
let loop;

class AboutExperience {
    constructor(container) {
        renderer = createRenderer();
        scene = createScene();
        loop = new Loop(camera, scene, renderer);
        container.append(renderer.domElement);
    }

    render() {
        renderer.render(scene, camera);
    }
    dispose() {
        
    }
    start() {
        loop.start();
    }
    stop() {
        loop.stop();
    }
}

export { AboutExperience };