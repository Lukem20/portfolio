import { ANIMATION_CONFIG, INTERACTION_CONFIG } from './config.js';

class AnimationState {
    constructor (name) {
        this.name = name;
    } 

    enter(context) {
        console.log(`Entering ${this.name} state`);
    }

    exit(context) {
        console.log(`Exiting ${this.name} state`);
    }

    update(context, deltaTime) {
        return this;
    }

    canTransitionTo(stateName) {
        return true;
    }

    isIdle() { return false; }
    isScrolling() { return false; }
    isSnapping() { return false; }
    isConverging() { return false; }
    isContextLost() { return false; }
}

class IdleState extends AnimationState {
    constructor() {
        super('idle');
    }

    isIdle() { return true; }

    enter(context) {
        super.enter(context);
        context.resetVelocity();
    }

    update(context, deltaTime) {
        context.applyFriction();

        if (Math.abs(context.currentVelocity) > ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
            return context.getState('scrolling');
        }

        return this;
    }

    canTransitionTo(stateName) {
        return ['scrolling', 'snapping', 'converging'].includes(stateName);
    }
}

class ScrollingState extends AnimationState {
    constructor() {
        super('scrolling');
    }

    isScrolling() { return true; }

    update(context, deltaTime) {
        // Update velocity with lerping
        context.currentVelocity = this.lerp(context.currentVelocity, context.targetVelocity, 0.1);
        context.applyFriction();
        
        // Apply rotation if there's velocity
        if (Math.abs(context.currentVelocity) > ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
            context.notifyObservers('rotate', { angle: context.currentVelocity });
        }
        
        // Transition to idle when velocity is low
        if (Math.abs(context.currentVelocity) < ANIMATION_CONFIG.VELOCITY_THRESHOLD && 
            Math.abs(context.targetVelocity) < ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
            return context.getState('idle');
        }
        
        return this;
    }

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
}

class SnappingState extends AnimationState {
    constructor() {
        super('snapping');
    }

    isSnapping() { return true; }

    enter(context) {
        super.enter(context);
        context.resetVelocity();
        context.snapProgress = 0;
    }

    update(context, deltaTime) {
        context.snapProgress += ANIMATION_CONFIG.SNAP_SPEED;

        if (context.snapProgress >= 1) {
            context.snapProgress = 1;

            // Final snap rotation
            const finalRotation = this.calculateSnapRotation(context);
            context.notifyObservers('rotate', { angle: finalRotation });
            
            // Request hover check after snap completes
            context.notifyObservers('requestHoverCheck');
            
            return context.getState('idle');
        }

        // Calculate and apply current snap rotation
        const currentRotation = this.calculateSnapRotation(context);
        context.notifyObservers('rotate', { angle: currentRotation });
        
        return this;
    }

    calculateSnapRotation(context) {
        const eased = 1 - Math.pow(1 - context.snapProgress, 3);
        const targetRotation = context.snapStartRotation + (context.snapTargetRotation - context.snapStartRotation) * eased;
        
        const deltaRotation = targetRotation - context.lastSnapRotation;
        context.lastSnapRotation = targetRotation;
        
        return deltaRotation;
    }
}

class ConvergingState extends AnimationState {
    constructor() {
        super('converging');
    }

    isConverging() { return true; }

    enter(context) {
        super.enter(context);
        context.resetVelocity();
        context.convergeProgress = 0;

        // Schedule navigation after animation
        context.scheduleNavigation();
    }

    exit(context) {
        super.exit(context);
        context.cancelNavigation();
    }

    update(context, deltaTime) {
        context.convergeProgress += ANIMATION_CONFIG.CONVERGE_SPEED;
        
        if (context.convergeProgress >= 1) {
            context.convergeProgress = 1;
        }

        const easing = this.calculateEasing(context.convergeProgress);
        context.notifyObservers('converge', { 
            progress: context.convergeProgress, 
            easing: easing 
        });
        
        return this; // Stay in converging state until external transition
    }

    calculateEasing(progress) {
        return 1 - Math.pow(1 - progress, 3);
    }

    canTransitionTo(stateName) {
        // Can only transition to idle (for cancellation)
        return stateName === 'idle';
    }
}

class ContextLostState extends AnimationState {
    constructor() {
        super('contextLost');
    }

    isContextLost() { return true; }

    enter(context) {
        super.enter(context);
        context.resetAll();
    }

    update(context, deltaTime) {
        // Do nothing while context is lost
        return this;
    }

    canTransitionTo(stateName) {
        // Can only transition back to idle when context is restored
        return stateName === 'idle';
    }
}

/**
 * Observer Pattern: StateManager notifies observers of state changes
 * This allows other components to react to state changes without tight coupling
 */
class Observable {
    constructor() {
        this.observers = new Map();
    }

    addObserver(event, callback) {
        if (!this.observers.has(event)) {
            this.observers.set(event, []);
        }
        this.observers.get(event).push(callback);
    }

    removeObserver(event, callback) {
        if (this.observers.has(event)) {
            const callbacks = this.observers.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notifyObservers(event, data = {}) {
        if (this.observers.has(event)) {
            this.observers.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Observer callback error for event ${event}:`, error);
                }
            });
        }
    }
}

/**
 * Enhanced StateManager using Finite State Machine pattern
 * This ensures only valid state transitions and eliminates impossible state combinations
 */
export class StateManager extends Observable {
    constructor() {
        super();
        
        // Initialize states
        this.states = {
            idle: new IdleState(),
            scrolling: new ScrollingState(),
            snapping: new SnappingState(),
            converging: new ConvergingState(),
            contextLost: new ContextLostState()
        };
        
        this.currentState = this.states.idle;
        
        // Animation properties
        this.targetVelocity = 0;
        this.currentVelocity = 0;
        
        // Snap properties
        this.snapStartRotation = 0;
        this.snapTargetRotation = 0;
        this.snapProgress = 0;
        this.lastSnapRotation = 0;
        this.snapRequested = false;
        
        // Converge properties
        this.convergeProgress = 0;
        this.clickedMesh = null;
        this.navigationTimeoutId = null;
        
        // Hover properties
        this.hoverState = 'none';
        this.hoveredMesh = null;
        
        // Context properties
        this.contextLostFlag = false;
        
        // Performance tracking
        this.lastUpdate = performance.now();
    }

    // State machine methods
    transitionTo(stateName) {
        if (!this.states[stateName]) {
            console.error(`Unknown state: ${stateName}`);
            return false;
        }

        if (!this.currentState.canTransitionTo(stateName)) {
            console.warn(`Invalid transition from ${this.currentState.name} to ${stateName}`);
            return false;
        }

        const oldState = this.currentState;
        oldState.exit(this);
        
        this.currentState = this.states[stateName];
        this.currentState.enter(this);
        
        this.notifyObservers('stateChange', {
            from: oldState.name,
            to: this.currentState.name
        });
        
        return true;
    }

    update() {
        const now = performance.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;
        
        // Handle snap request
        if (this.snapRequested && !this.isConverging()) {
            this.snapRequested = false;
            this.handleSnapRequest();
        }
        
        // Update current state
        const nextState = this.currentState.update(this, deltaTime);
        if (nextState !== this.currentState) {
            this.transitionTo(nextState.name);
        }
    }

    // Public API methods
    updateVelocity(deltaVelocity) {
        this.targetVelocity += deltaVelocity;
        this.targetVelocity = Math.max(
            -ANIMATION_CONFIG.MAX_VELOCITY, 
            Math.min(ANIMATION_CONFIG.MAX_VELOCITY, this.targetVelocity)
        );
        
        if (!this.isConverging() && !this.isSnapping()) {
            this.transitionTo('scrolling');
        }
    }

    setVelocity(velocity) {
        this.targetVelocity = Math.max(
            -ANIMATION_CONFIG.MAX_VELOCITY, 
            Math.min(ANIMATION_CONFIG.MAX_VELOCITY, velocity)
        );
        
        if (!this.isConverging() && !this.isSnapping()) {
            this.transitionTo('scrolling');
        }
    }

    requestSnap() {
        this.snapRequested = true;
    }

    handleSnapRequest() {
        if (this.isConverging()) return;
        
        // Request snap calculation from geometry manager
        this.notifyObservers('calculateSnap', {
            callback: (snapData) => {
                if (Math.abs(snapData.angle) < 0.01) return; // Already aligned
                
                this.snapStartRotation = 0;
                this.snapTargetRotation = snapData.angle;
                this.lastSnapRotation = 0;
                
                // Update project title
                this.notifyObservers('updateTitle', {
                    title: snapData.closestMesh?.name?.projectTitle || 'Unknown Project'
                });
                
                this.transitionTo('snapping');
            }
        });
    }

    initializeConverge(mesh) {
        if (!mesh) {
            console.error('Cannot initialize converge: no mesh provided');
            return false;
        }
        
        this.clickedMesh = mesh;
        this.transitionTo('converging');
        return true;
    }

    endConvergeAnimation() {
        if (this.isConverging()) {
            this.clickedMesh = null;
            this.transitionTo('idle');
        }
    }

    setHoverState(state, mesh = null) {
        this.hoverState = state;
        this.hoveredMesh = mesh;
    }

    setContextLost(lost) {
        this.contextLostFlag = lost;
        if (lost) {
            this.transitionTo('contextLost');
        } else if (this.currentState.isContextLost()) {
            this.transitionTo('idle');
        }
    }

    isContextLost() {
        return this.currentState.isContextLost();
    }

    // Utility methods
    resetVelocity() {
        this.targetVelocity = 0;
        this.currentVelocity = 0;
    }

    applyFriction() {
        this.targetVelocity *= ANIMATION_CONFIG.FRICTION;
        
        if (Math.abs(this.targetVelocity) < ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
            this.targetVelocity = 0;
        }
        if (Math.abs(this.currentVelocity) < ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
            this.currentVelocity = 0;
        }
    }

    resetAll() {
        this.resetVelocity();
        this.snapProgress = 0;
        this.convergeProgress = 0;
        this.clickedMesh = null;
        this.snapRequested = false;
        this.cancelNavigation();
    }

    scheduleNavigation() {
        this.cancelNavigation();
        this.navigationTimeoutId = setTimeout(() => {
            if (this.hoveredMesh && this.hoveredMesh.name && this.hoveredMesh.name.projectPath) {
                this.notifyObservers('navigate', { 
                    path: this.hoveredMesh.name.projectPath 
                });
            }
        }, ANIMATION_CONFIG.CONVERGE_DURATION);
    }

    cancelNavigation() {
        if (this.navigationTimeoutId) {
            clearTimeout(this.navigationTimeoutId);
            this.navigationTimeoutId = null;
        }
    }

    // State queries
    getState(name) {
        return this.states[name];
    }

    isIdle() { return this.currentState.isIdle(); }
    isScrolling() { return this.currentState.isScrolling(); }
    isSnapping() { return this.currentState.isSnapping(); }
    isConverging() { return this.currentState.isConverging(); }
    isContextLost() { return this.currentState.isContextLost(); }

    canClick() {
        return this.hoverState === 'hovering' && 
               !this.isSnapping() && 
               Math.abs(this.currentVelocity) < INTERACTION_CONFIG.VELOCITY_CLICK_THRESHOLD;
    }

    // Debug information
    getDebugInfo() {
        return {
            currentState: this.currentState.name,
            hoverState: this.hoverState,
            hasHoveredMesh: !!this.hoveredMesh,
            velocities: {
                target: this.targetVelocity,
                current: this.currentVelocity
            },
            snap: {
                progress: this.snapProgress,
                requested: this.snapRequested
            },
            converge: {
                progress: this.convergeProgress,
                hasClickedMesh: !!this.clickedMesh
            },
            context: {
                isLost: this.isContextLost
            }
        };
    }
}