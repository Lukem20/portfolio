import HomeExperience from '../../HomeExperience.js';
import WheelState from './WheelState.js';
import WheelScene from './WheelScene.js';
import WheelInteraction from './WheelInteraction.js';
import WheelAnimation from './WheelAnimation.js';
import WheelHover from './WheelHover.js';

export default class PhotoWheels {
    constructor() {
        this.experience =  new HomeExperience();
        this.state =       new WheelState();
        this.animation =   new WheelAnimation(this.state, this.experience);
        this.hover =       new WheelHover(this.state, this.experience);
        this.interaction = new WheelInteraction(this.state, this.experience, this.animation);
        this.scene =       new WheelScene(this.state, this.experience);

        // Allow animation to access interaction for hover checks
        this.animation.interaction = this.interaction;

        this.instance = this.scene.initialize();
        this.interaction.setupEventListeners();
    }

    setupWebGLContextListeners(rendererInstance) {
        const canvas = rendererInstance.domElement;
        canvas.addEventListener('webglcontextlost', this.interaction.handleContextLoss, false);
        canvas.addEventListener('webglcontextrestored', this.interaction.handleContextRestored, false);
    }

    cleanupEventListeners() {
        this.interaction.cleanupEventListeners();
    }

    tick = () => {
        if (this.state.isContextLost || document.hidden) return;

        this.animation.updateConvergeAnimation();

        if (this.state.isStepRotating || this.state.isSnapping) {
            this.animation.updateSnapAnimation();
        } else {
            this.animation.updateSpinAnimation();
        }

        this.hover.updateHoverEffects();
        this.hover.updateShaderMaterials();
    }
}