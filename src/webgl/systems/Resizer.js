import EventEmitter from "./EventEmitter";

export default class Resizer extends EventEmitter {
    constructor(container, camera, renderer) {
        super();
        this.container = container;
        this.camera = camera;
        this.renderer = renderer;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.setSize();

        window.addEventListener("resize", () => {
            this.trigger('resize');
            this.setSize();
        });
    }

    setSize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(this.pixelRatio);
    }
}