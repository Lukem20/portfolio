import { Clock } from "three";
import EventEmitter from "./EventEmitter";

const clock = new Clock();

export default class Loop extends EventEmitter {
    constructor(camera, scene, renderer) {
        super();
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.updatables = [];
    }

    start() {
        this.renderer.setAnimationLoop(() => {
            this.trigger('tick');
            this.tick();
            this.renderer.render(this.scene, this.camera);
        });
    }

    stop() {
        this.renderer.setAnimationLoop(null);
    }

    tick() {
        const deltaTime = clock.getElapsedTime();
        for (const object of this.updatables) {
            object.tick(deltaTime);
        }
    }
}