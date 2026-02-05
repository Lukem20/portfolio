// Systems
import { createScene } from '../shared/scene.js';
import { createRenderer } from '../shared/renderer.js';
import Resizer from '../shared/Resizer.js';
import Loop from '../shared/Loop.js';
import Debug from '../shared/Debug.js';

// Components
import Camera from './components/Camera.js';
import Lights from './components/Lights.js';
import Background from './components/Background.js';
import PhotoWheels from './components/PhotoWheel/PhotoWheels.js';

let instance = null;

export default class HomeExperience {
    constructor(container) {
        if (instance) return instance;
        instance = this;

        this.container =   container;
        this.renderer =    createRenderer();
        this.scene =       createScene();
        this.camera =      new Camera();
        this.resizer =     new Resizer(this.container, this.camera.instance, this.renderer);
        this.loop =        new Loop(this.camera.instance, this.scene, this.renderer);
        this.background =  new Background();
        this.lights =      new Lights(this.scene);
        this.photoWheels = new PhotoWheels();
        this.debug =       new Debug();
        
        this.container.append(this.renderer.domElement);
        this.photoWheels.setupWebGLContextListeners(this.renderer);
        
        this.scene.add(this.lights.group, this.photoWheels.instance, this.camera.instance, this.background.mesh);

        for (const light of this.lights.group.children) this.loop.updatables.push(light);
        this.loop.updatables.push(this.camera);
        this.loop.updatables.push(this.photoWheels);
        
        // this.loop.on('tick', ()=> {});
        // this.resizer.on('resize', () => {});
    }

    render() {
        this.renderer.render(this.scene, this.camera.instance);
    }
    dispose() {
        this.photoWheels.cleanupEventListeners();
        this.resizer.dispose();
        this.stop();
    }
    start() {
        this.loop.start();
    }
    stop() {
        this.loop.stop();
    }
}