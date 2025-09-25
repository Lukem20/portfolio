// PhotoWheels.js - Main orchestrator that coordinates all subsystems
import { ResourceManager } from './ResourceManager.js';
import { StateManager } from './StateManager.js';
import { InteractionManager } from './InteractionManager.js';
import { GeometryManager } from './GeometryManager.js';
import { EventManager, TimeoutManager, WebGLContextManager } from './EventManager.js';

/**
 * PhotoWheels provides a simple interface to a complex subsystem
 * This hides the complexity of resource management, state management, interaction handling, etc.
 */
export class PhotoWheels {
    constructor(camera, container) {
        this.camera = camera;
        this.container = container;
        
        // Initialize subsystems using Dependency Injection pattern
        this.resourceManager = new ResourceManager();
        this.eventManager = new EventManager();
        this.timeoutManager = new TimeoutManager();
        this.stateManager = new StateManager();
        this.geometryManager = new GeometryManager(this.resourceManager);
        this.interactionManager = new InteractionManager(this.stateManager, this.timeoutManager, camera);
        
        // WebGL context management
        this.webGLContextManager = null;
        
        // Performance tracking
        this.lastUpdate = performance.now();
        this.lastMaintenanceCheck = 0;
        this.maintenanceInterval = 300000; // 5 minutes
        
        this.initialize();
    }

    initialize() {
        this.setupGeometry();
        this.setupStateObservers();
        this.setupInteractions();
        this.setupLifecycleEvents();
        
        console.log('PhotoWheels: Initialization complete');
    }

    setupGeometry() {
        this.geometryManager.setCamera(this.camera);
    }

    setupStateObservers() {
        // Observer Pattern: StateManager notifies us of state changes
        this.stateManager.addObserver('rotate', (data) => {
            this.geometryManager.rotateWheels(data.angle);
        });

        this.stateManager.addObserver('converge', (data) => {
            this.geometryManager.updateConvergeAnimation(data.progress, data.easing);
        });

        this.stateManager.addObserver('calculateSnap', (data) => {
            const snapData = this.geometryManager.calculateSnapAngle();
            data.callback(snapData);
        });

        this.stateManager.addObserver('updateTitle', (data) => {
            this.updateProjectTitle(data.title);
        });

        this.stateManager.addObserver('requestHoverCheck', () => {
            this.interactionManager.forceHoverCheck(this.geometryManager.getAllMeshes());
        });

        this.stateManager.addObserver('navigate', (data) => {
            this.cleanup(); // Clean up before navigation
            window.location.href = data.path;
        });

        this.stateManager.addObserver('stateChange', (data) => {
            console.log(`State transition: ${data.from} -> ${data.to}`);
            
            if (data.to === 'converging') {
                this.handleConvergeStart();
            } else if (data.from === 'converging' && data.to === 'idle') {
                this.handleConvergeEnd();
            }
        });
    }

    setupInteractions() {
        // Attach interaction manager to DOM elements
        this.interactionManager.attachTo(this.container, document);
    }

    setupLifecycleEvents() {
        // Page lifecycle events using EventManager for consistent cleanup
        this.eventManager.add(document, 'visibilitychange', () => {
            if (document.hidden && this.stateManager.isConverging()) {
                this.stateManager.endConvergeAnimation();
            }
        });

        this.eventManager.add(window, 'pageshow', (event) => {
            if (event.persisted) {
                // Page was restored from cache - reset everything
                this.resetToInitialState();
            }
        });

        this.eventManager.add(window, 'pagehide', () => {
            this.handlePageHide();
        });

        this.eventManager.add(window, 'beforeunload', () => {
            this.cleanup();
        });

        this.eventManager.activate();
    }

    setupWebGL(renderer) {
        const canvas = renderer.domElement;
        
        this.webGLContextManager = new WebGLContextManager(
            canvas,
            () => {
                // Context lost callback
                this.stateManager.setContextLost(true);
                console.warn('PhotoWheels: WebGL context lost - pausing animations');
            },
            () => {
                // Context restored callback
                this.stateManager.setContextLost(false);
                console.log('PhotoWheels: WebGL context restored');
            }
        );
    }

    // Main update loop - called from World.js
    tick() {
        if (this.stateManager.isContextLost()) {
            return;
        }

        const now = performance.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;

        // Update state machine
        this.stateManager.update();

        // Update hover effects if not converging
        if (!this.stateManager.isConverging()) {
            this.interactionManager.updateHover(this.geometryManager.getAllMeshes());
            
            // Update hover animations
            if (this.interactionManager.isHovering()) {
                this.geometryManager.updateHover(
                    this.interactionManager.getCurrentHoveredMesh(),
                    this.interactionManager.mouse
                );
            } else {
                this.geometryManager.updateHover(null, null);
            }
        }

        // Periodic maintenance
        if (now - this.lastMaintenanceCheck > this.maintenanceInterval) {
            this.performMaintenance();
            this.lastMaintenanceCheck = now;
        }
    }

    // Event handlers
    handleConvergeStart() {
        const clickedMesh = this.stateManager.clickedMesh;
        if (clickedMesh) {
            this.geometryManager.startConvergeAnimation(clickedMesh);
        }
    }

    handleConvergeEnd() {
        this.geometryManager.stopConvergeAnimation();
        this.geometryManager.resetAllMeshes();
    }

    handlePageHide() {
        if (this.stateManager.isConverging()) {
            this.stateManager.endConvergeAnimation();
        }

        // Auto-dispose resources after extended period
        setTimeout(() => {
            if (document.hidden) {
                console.log('PhotoWheels: Page hidden for extended period - disposing resources');
                this.resourceManager.dispose();
            }
        }, 30000);
    }

    resetToInitialState() {
        this.stateManager.resetAll();
        this.geometryManager.resetAllMeshes();
        this.timeoutManager.clearAll();
    }

    performMaintenance() {
        this.resourceManager.performMaintenanceCleanup();
        this.geometryManager.performMaintenance();
        
        console.log(`PhotoWheels: Maintenance performed. Active timeouts: ${this.timeoutManager.size()}`);
    }

    updateProjectTitle(title) {
        const projectTitleElement = document.getElementById('project-title');
        if (projectTitleElement) {
            projectTitleElement.textContent = title;
        }
    }

    // Public API for World.js
    cleanup() {
        console.log('PhotoWheels: Cleaning up...');
        
        // Stop all animations
        this.stateManager.resetAll();
        this.timeoutManager.clearAll();
        this.interactionManager.detachFrom();
        
        // Cleanup WebGL
        if (this.webGLContextManager) {
            this.webGLContextManager.dispose();
        }
        
        this.eventManager.dispose();
        this.geometryManager.dispose();
        this.resourceManager.dispose();
        
        console.log('PhotoWheels: Cleanup complete');
    }

    disposeResources() {
        // Legacy method for backward compatibility
        this.cleanup();
    }

    // Getters for World.js
    getWheelGroup() {
        return this.geometryManager.getWheelGroup();
    }

    // Debug methods
    getDebugInfo() {
        return {
            state: this.stateManager.getDebugInfo(),
            resources: this.resourceManager.getResourceStats(),
            events: this.eventManager.getStats(),
            timeouts: this.timeoutManager.size(),
            meshCount: this.geometryManager.getAllMeshes().length
        };
    }

    // Performance monitoring
    getPerformanceStats() {
        return {
            lastUpdate: this.lastUpdate,
            lastMaintenance: this.lastMaintenanceCheck,
            frameDelta: performance.now() - this.lastUpdate
        };
    }
}

/**
 * Factory function for backward compatibility with existing code
 * This maintains the same interface as your original createPhotos function
 */
export function createPhotos(camera, container) {
    const photoWheels = new PhotoWheels(camera, container);
    
    // Create a wrapper object that matches your original API
    const wrapper = photoWheels.getWheelGroup();
    
    // Attach methods to the group object for compatibility
    wrapper.tick = () => photoWheels.tick();
    wrapper.cleanup = () => photoWheels.cleanup();
    wrapper.setupWebGL = (renderer) => photoWheels.setupWebGL(renderer);
    wrapper.disposeResources = () => photoWheels.disposeResources();
    
    // Store reference to the PhotoWheels instance
    wrapper._photoWheelsInstance = photoWheels;
    
    return wrapper;
}