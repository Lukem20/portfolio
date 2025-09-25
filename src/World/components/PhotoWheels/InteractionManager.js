import { Vector2, Raycaster } from 'three';
import { SCROLL_CONFIG } from './config.js';


/**
 * Different input strategies for different input types.
 * Handles mouse, touch, and keyboard inputs.
 */
class InputStrategy {
    process(event, context) {
        throw new Error('Strategy must implement process method');
    }
}


class MouseWheelStrategy extends InputStrategy {
    process(event, context) {
        event.preventDefault();

        const scrollIntensity = Math.abs(event.deltaY) / SCROLL_CONFIG.INTENSITY_DIVISOR;
        let velocityChange = Math.min(
            scrollIntensity * SCROLL_CONFIG.BASE_VELOCITY_CHANGE, 
            SCROLL_CONFIG.MAX_VELOCITY_CHANGE
        );

        const isTrackpad = Math.abs(event.deltaY) < SCROLL_CONFIG.TRACKPAD_THRESHOLD;
        const delay = isTrackpad ? SCROLL_CONFIG.TRACKPAD_SNAP_DELAY : SCROLL_CONFIG.MOUSE_WHEEL_SNAP_DELAY;
        
        if (isTrackpad) {
            velocityChange *= SCROLL_CONFIG.TRACKPAD_MULTIPLIER;
        }

        const direction = event.deltaY > 0 ? -1 : 1;
        
        return {
            type: 'wheel',
            velocityChange: velocityChange * direction,
            snapDelay: delay
        };
    }
}


class TouchStrategy extends InputStrategy {
    constructor() {
        super();
        this.startPosition = { x: null, y: null };
    }

    process(event, context) {
        switch (event.type) {
            case 'touchstart':
                return this.handleStart(event);
            case 'touchmove':
                return this.handleMove(event);
            case 'touchend':
                return this.handleEnd(event);
        }
    }

    handleStart(event) {
        const touch = event.touches[0];
        this.startPosition.x = touch.clientX;
        this.startPosition.y = touch.clientY;
        
        return { type: 'touchStart' };
    }

    handleMove(event) {
        if (!this.startPosition.x || !this.startPosition.y) return null;

        const touch = event.touches[0];
        const xDiff = this.startPosition.x - touch.clientX;
        const yDiff = this.startPosition.y - touch.clientY;

        let swipeSpeed = Math.sqrt(xDiff * xDiff + yDiff * yDiff) / SCROLL_CONFIG.SWIPE_DIVISOR;
        swipeSpeed = Math.min(swipeSpeed, SCROLL_CONFIG.MAX_SWIPE_SPEED);

        let velocity = 0;
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            velocity = xDiff > 0 ? -swipeSpeed : swipeSpeed;
        } else {
            velocity = yDiff > 0 ? swipeSpeed : -swipeSpeed;
        }

        // Update start position for continuous swiping
        this.startPosition.x = touch.clientX;
        this.startPosition.y = touch.clientY;

        return {
            type: 'touchMove',
            velocityChange: velocity,
            snapDelay: SCROLL_CONFIG.SWIPE_SNAP_DELAY
        };
    }

    handleEnd(event) {
        this.startPosition.x = null;
        this.startPosition.y = null;
        return { type: 'touchEnd' };
    }
}


/**
 * Encapsulate user actions as objects to queue, undo, or log user interactions
 */
class Command {
    execute() {
        throw new Error('Command must implement execute method');
    }
    
    undo() {
        
    }
}


class ScrollCommand extends Command {
    constructor(velocityChange, snapDelay, stateManager, timeoutManager) {
        super();
        this.velocityChange = velocityChange;
        this.snapDelay = snapDelay;
        this.stateManager = stateManager;
        this.timeoutManager = timeoutManager;
    }

    execute() {
        // Stop any existing snap animation
        this.stateManager.transitionTo('scrolling');
        this.stateManager.updateVelocity(this.velocityChange);
        // Schedule snap animation
        this.timeoutManager.set('snap', () => {
            this.stateManager.requestSnap();
        }, this.snapDelay);
    }
}


class ClickCommand extends Command {
    constructor(mesh, stateManager, navigationCallback) {
        super();
        this.mesh = mesh;
        this.stateManager = stateManager;
        this.navigationCallback = navigationCallback;
    }

    execute() {
        if (!this.mesh) {
            console.warn('ClickCommand: No mesh provided');
            return;
        }

        if (this.stateManager.isConverging()) {
            this.navigationCallback(this.mesh.name.projectPath);
        } else {
            this.stateManager.initializeConverge(this.mesh);
        }
    }
}


/**
 * StateManager notifies InteractionManager of state changes
 * This decouples the state management from the interaction handling
 */
export class InteractionManager {
    constructor(stateManager, timeoutManager, camera) {
        this.stateManager = stateManager;
        this.timeoutManager = timeoutManager;
        this.camera = camera;
        
        this.mouse = new Vector2();
        this.raycaster = new Raycaster();
        this.mouseMovedSinceLastCheck = false;
        
        this.strategies = {
            wheel: new MouseWheelStrategy(),
            touch: new TouchStrategy()
        };
        
        this.currentHover = new NullHoverState();
        
        this.boundHandlers = {
            wheel: this.handleWheel.bind(this),
            touchstart: this.handleTouch.bind(this),
            touchmove: this.handleTouch.bind(this),
            touchend: this.handleTouch.bind(this),
            mousemove: this.handleMouseMove.bind(this),
            click: this.handleClick.bind(this)
        };
    }

    // Public API
    attachTo(container, document) {
        this.container = container;
        this.document = document;
        
        document.addEventListener('wheel', this.boundHandlers.wheel);
        document.addEventListener('touchstart', this.boundHandlers.touchstart);
        document.addEventListener('touchmove', this.boundHandlers.touchmove);
        document.addEventListener('touchend', this.boundHandlers.touchend);
        container.addEventListener('mousemove', this.boundHandlers.mousemove);
        container.addEventListener('click', this.boundHandlers.click);
    }

    detachFrom() {
        if (!this.document || !this.container) return;
        
        this.document.removeEventListener('wheel', this.boundHandlers.wheel);
        this.document.removeEventListener('touchstart', this.boundHandlers.touchstart);
        this.document.removeEventListener('touchmove', this.boundHandlers.touchmove);
        this.document.removeEventListener('touchend', this.boundHandlers.touchend);
        this.container.removeEventListener('mousemove', this.boundHandlers.mousemove);
        this.container.removeEventListener('click', this.boundHandlers.click);
    }

    updateHover(meshes) {
        if (!this.mouseMovedSinceLastCheck || this.stateManager.isConverging()) {
            return;
        }

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(meshes);
        
        if (intersects.length === 0) {
            this.setHoverState(new NullHoverState());
        } else {
            this.setHoverState(new ActiveHoverState(intersects[0].object));
        }
        
        this.mouseMovedSinceLastCheck = false;
    }

    forceHoverCheck(meshes) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(meshes);
        
        if (intersects.length === 0) {
            this.setHoverState(new NullHoverState());
        } else {
            this.setHoverState(new ActiveHoverState(intersects[0].object));
        }
    }

    // Private methods
    handleWheel(event) {
        if (this.stateManager.isConverging()) {
            this.stateManager.endConvergeAnimation();
            return;
        }

        const result = this.strategies.wheel.process(event, this.stateManager);
        if (result) {
            const command = new ScrollCommand(
                result.velocityChange,
                result.snapDelay,
                this.stateManager,
                this.timeoutManager
            );
            command.execute();
        }
    }

    handleTouch(event) {
        if (this.stateManager.isConverging() && event.type === 'touchstart') {
            this.stateManager.endConvergeAnimation();
        }

        const result = this.strategies.touch.process(event, this.stateManager);
        if (result && result.type === 'touchMove' && result.velocityChange) {
            const command = new ScrollCommand(
                result.velocityChange,
                result.snapDelay,
                this.stateManager,
                this.timeoutManager
            );
            command.execute();
        }
    }

    handleMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.mouseMovedSinceLastCheck = true;
    }

    handleClick() {
        if (!this.currentHover.isActive()) return;
        if (!this.stateManager.canClick()) return;

        const command = new ClickCommand(
            this.currentHover.getMesh(),
            this.stateManager,
            (projectPath) => {
                window.location.href = projectPath;
            }
        );
        command.execute();
    }

    setHoverState(newState) {
        if (this.currentHover.equals(newState)) return;
        
        this.currentHover.exit();
        this.currentHover = newState;
        this.currentHover.enter();
        
        document.body.style.cursor = this.currentHover.getCursor();
        
        // Update state manager
        this.stateManager.setHoverState(
            this.currentHover.isActive() ? 'hovering' : 'none',
            this.currentHover.getMesh()
        );
    }

    getCurrentHoveredMesh() {
        return this.currentHover.getMesh();
    }

    isHovering() {
        return this.currentHover.isActive();
    }
}

/**
 * State Pattern: Different hover states with different behaviors
 * This eliminates null checks and makes hover behavior more predictable
 */
class HoverState {
    enter() {}
    exit() {}
    isActive() { return false; }
    getMesh() { return null; }
    getCursor() { return 'default'; }
    equals(other) {
        return this.constructor === other.constructor && 
               this.getMesh() === other.getMesh();
    }
}

class NullHoverState extends HoverState {
    getCursor() { return 'default'; }
}

class ActiveHoverState extends HoverState {
    constructor(mesh) {
        super();
        this.mesh = mesh;
    }

    isActive() { return true; }
    getMesh() { return this.mesh; }
    getCursor() { return 'pointer'; }
    
    equals(other) {
        return other instanceof ActiveHoverState && other.mesh === this.mesh;
    }
}