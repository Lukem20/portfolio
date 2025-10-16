// Systems
import { createScene } from '../systems/scene.js';
import { createRenderer } from '../systems/renderer.js';
import { Resizer } from '../systems/Resizer.js';
import { Loop } from '../systems/Loop.js';

// Components
import { createCamera } from './components/camera.js';
import { createLights } from './components/lights.js';
import { createBackground } from './components/background.js';
import { createWheels } from './components/photoWheels.js';

let instance = null;

class HomeExperience {
    constructor(container) {
        if (instance) return instance;
        instance = this;

        this.container = container;
        this.renderer = createRenderer();
        this.scene = createScene();
        this.camera = createCamera();
        this.loop = new Loop(this.camera, this.scene, this.renderer);
        this.background = createBackground();
        this.lights = createLights();
        this.photoWheels = createWheels();
        
        this.container.append(this.renderer.domElement);
        this.photoWheels.setupWebGL(this.renderer);
        
        this.scene.add(this.lights, this.photoWheels, this.camera, this.background);

        for (const light of this.lights.children) this.loop.updatables.push(light);
        this.loop.updatables.push(this.camera);
        this.loop.updatables.push(this.photoWheels);
        this.loop.on('tick', ()=> {});

        this.resizer = new Resizer(this.container, this.camera, this.renderer);
        this.resizer.on('resize', () => {});
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
    dispose() {
        if (this.photoWheels) {
            this.photoWheels.cleanup();
        }
    }
    start() {
        this.loop.start();
    }
    stop() {
        this.loop.stop();
    }
}
    
export { HomeExperience };