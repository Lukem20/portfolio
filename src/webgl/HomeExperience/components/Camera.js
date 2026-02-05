import { 
    PerspectiveCamera,
    Clock,
} from 'three';
import HomeExperience from '../HomeExperience.js';


export default class Camera {
    constructor() {
        this.cursor = {
            x: 0,
            y: 0,
        }
        this.lastMouseUpdate = 0;
        this.mouseThrottle = 8; // ~120fps
        this.clock = new Clock();
        this.previousTime = 0;

        this.experience = new HomeExperience();
        this.instance = new PerspectiveCamera(
            60, window.innerWidth / window.innerHeight, 0.1, 1000
        );

        this.setPosition();

        this.experience.container.addEventListener('mousemove', (event) => {
            const now = performance.now();

            if (now - this.lastMouseUpdate > this.mouseThrottle) {
                this.cursor.x = event.clientX / window.innerWidth - 0.5;
                this.cursor.y = event.clientY / window.innerHeight - 0.5;
                this.lastMouseUpdate = now;
            }
        });
    }

    setPosition() {
        this.instance.position.x = 0;
        this.instance.position.y = 0;
        this.instance.position.z = 130;
    }

    tick() {
        const elapsedTime = this.clock.getElapsedTime();
        const deltaTime = elapsedTime - this.previousTime;
        this.previousTime = elapsedTime;

        const parallaxX = this.cursor.x * 10;
        const parallaxY = - this.cursor.y * 10;

        const lerpFactor = Math.min(deltaTime * 2, 0.016); // ~60fps

        this.instance.position.x += (parallaxX - this.instance.position.x) * lerpFactor;
        this.instance.position.y += (parallaxY - this.instance.position.y) * lerpFactor;
    }
}