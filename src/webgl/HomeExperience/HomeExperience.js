// Systems
import { createScene } from '../systems/scene.js';
import { createRenderer } from '../systems/renderer.js';
import Resizer from '../systems/Resizer.js';
import Loop from '../systems/Loop.js';

// Components
import Camera from './components/camera.js';
import Lights from './components/lights.js';
import Background from './components/background.js';
import PhotoWheels from './components/PhotoWheel/photoWheels.js';

let instance = null;

export default class HomeExperience {
    constructor(container) {
        if (instance) return instance;
        instance = this;

        this.container = container;
        this.renderer = createRenderer();
        this.scene = createScene();
        this.camera = new Camera();
        this.loop = new Loop(this.camera.instance, this.scene, this.renderer);
        this.background = new Background();
        this.lights = new Lights();
        this.photoWheels = new PhotoWheels();
        
        this.container.append(this.renderer.domElement);
        this.photoWheels.setupWebGLContextListeners(this.renderer);
        
        this.scene.add(this.lights.group, this.photoWheels.instance, this.camera.instance, this.background.mesh);

        for (const light of this.lights.group.children) this.loop.updatables.push(light);
        this.loop.updatables.push(this.camera);
        this.loop.updatables.push(this.photoWheels);
        this.loop.on('tick', ()=> {});

        this.resizer = new Resizer(this.container, this.camera.instance, this.renderer);
        this.resizer.on('resize', () => {});
    }

    render() {
        this.renderer.render(this.scene, this.camera.instance);
    }
    dispose() {
        if (this.photoWheels) {
            this.photoWheels.cleanupEventListeners();
        }
    }
    start() {
        this.loop.start();
    }
    stop() {
        this.loop.stop();
    }
}