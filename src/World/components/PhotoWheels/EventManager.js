export class EventManager {
    constructor() {
        this.listeners = new Map();
        this.isActive = false;
    }

    // Add listener with automatic cleanup tracking
    add(target, event, handler, options = false) {
        const key = `${target.constructor.name}-${event}`;
        
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        
        const listenerData = { target, event, handler, options };
        this.listeners.get(key).push(listenerData);
        
        if (this.isActive) {
            target.addEventListener(event, handler, options);
        }
        
        return listenerData;
    }

    // Activate all listeners
    activate() {
        if (this.isActive) {
            console.warn('EventManager: Already active');
            return;
        }
        
        let activatedCount = 0;
        for (const listeners of this.listeners.values()) {
            listeners.forEach(({ target, event, handler, options }) => {
                try {
                    target.addEventListener(event, handler, options);
                    activatedCount++;
                } catch (error) {
                    console.error('EventManager: Failed to activate listener:', error);
                }
            });
        }
        
        this.isActive = true;
        console.log(`EventManager: Activated ${activatedCount} event listeners`);
    }

    // Deactivate all listeners
    deactivate() {
        if (!this.isActive) {
            console.warn('EventManager: Already inactive');
            return;
        }
        
        let deactivatedCount = 0;
        for (const listeners of this.listeners.values()) {
            listeners.forEach(({ target, event, handler, options }) => {
                try {
                    target.removeEventListener(event, handler, options);
                    deactivatedCount++;
                } catch (error) {
                    console.error('EventManager: Failed to deactivate listener:', error);
                }
            });
        }
        
        this.isActive = false;
        console.log(`EventManager: Deactivated ${deactivatedCount} event listeners`);
    }

    // Remove specific listener
    remove(listenerData) {
        for (const [key, listeners] of this.listeners.entries()) {
            const index = listeners.indexOf(listenerData);
            if (index !== -1) {
                const { target, event, handler, options } = listenerData;
                
                // Remove from DOM if currently active
                if (this.isActive) {
                    try {
                        target.removeEventListener(event, handler, options);
                    } catch (error) {
                        console.error('EventManager: Failed to remove listener:', error);
                    }
                }
                
                // Remove from tracking
                listeners.splice(index, 1);
                
                // Clean up empty arrays
                if (listeners.length === 0) {
                    this.listeners.delete(key);
                }
                
                console.log(`EventManager: Removed listener for ${event}`);
                return true;
            }
        }
        
        console.warn('EventManager: Listener not found for removal');
        return false;
    }

    // Remove all listeners for a specific target
    removeTarget(target) {
        let removedCount = 0;
        
        for (const [key, listeners] of this.listeners.entries()) {
            const toRemove = listeners.filter(listener => listener.target === target);
            
            toRemove.forEach(listenerData => {
                const { event, handler, options } = listenerData;
                
                if (this.isActive) {
                    try {
                        target.removeEventListener(event, handler, options);
                        removedCount++;
                    } catch (error) {
                        console.error('EventManager: Failed to remove target listener:', error);
                    }
                }
            });
            
            // Remove from tracking array
            const remaining = listeners.filter(listener => listener.target !== target);
            if (remaining.length === 0) {
                this.listeners.delete(key);
            } else {
                this.listeners.set(key, remaining);
            }
        }
        
        console.log(`EventManager: Removed ${removedCount} listeners for target`);
        return removedCount;
    }

    // Clean up all listeners
    dispose() {
        this.deactivate();
        this.listeners.clear();
        console.log('EventManager: Disposed all listeners');
    }

    // Get stats for debugging
    getStats() {
        let totalListeners = 0;
        const eventTypes = {};
        
        for (const [key, listeners] of this.listeners.entries()) {
            totalListeners += listeners.length;
            eventTypes[key] = listeners.length;
        }
        
        return {
            eventTypes: this.listeners.size,
            totalListeners,
            isActive: this.isActive,
            breakdown: eventTypes
        };
    }

    // Check if a specific event type is being tracked
    hasEventType(target, event) {
        const key = `${target.constructor.name}-${event}`;
        return this.listeners.has(key);
    }

    // Get all listeners for a specific target
    getListenersForTarget(target) {
        const result = [];
        
        for (const listeners of this.listeners.values()) {
            listeners.forEach(listener => {
                if (listener.target === target) {
                    result.push(listener);
                }
            });
        }
        
        return result;
    }
}



// Timeout manager to handle multiple timeouts without conflicts
export class TimeoutManager {
    constructor() {
        this.timeouts = new Map();
        this.intervals = new Map();
    }

    // Set a timeout with a key for easy management
    set(key, callback, delay) {
        this.clear(key); // Clear existing timeout with same key
        
        const timeoutId = setTimeout(() => {
            this.timeouts.delete(key);
            try {
                callback();
            } catch (error) {
                console.error(`TimeoutManager: Error in timeout callback for key '${key}':`, error);
            }
        }, delay);
        
        this.timeouts.set(key, timeoutId);
        return timeoutId;
    }

    // Set an interval with a key for easy management
    setInterval(key, callback, delay) {
        this.clearInterval(key); // Clear existing interval with same key
        
        const intervalId = setInterval(() => {
            try {
                callback();
            } catch (error) {
                console.error(`TimeoutManager: Error in interval callback for key '${key}':`, error);
            }
        }, delay);
        
        this.intervals.set(key, intervalId);
        return intervalId;
    }

    // Clear a specific timeout
    clear(key) {
        const timeoutId = this.timeouts.get(key);
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            this.timeouts.delete(key);
            return true;
        }
        return false;
    }

    // Clear a specific interval
    clearInterval(key) {
        const intervalId = this.intervals.get(key);
        if (intervalId !== undefined) {
            clearInterval(intervalId);
            this.intervals.delete(key);
            return true;
        }
        return false;
    }

    // Clear all timeouts
    clearAll() {
        for (const timeoutId of this.timeouts.values()) {
            clearTimeout(timeoutId);
        }
        this.timeouts.clear();
        
        console.log('TimeoutManager: Cleared all timeouts');
    }

    // Clear all intervals
    clearAllIntervals() {
        for (const intervalId of this.intervals.values()) {
            clearInterval(intervalId);
        }
        this.intervals.clear();
        
        console.log('TimeoutManager: Cleared all intervals');
    }

    // Clear everything
    dispose() {
        this.clearAll();
        this.clearAllIntervals();
    }

    // Check if a timeout exists
    has(key) {
        return this.timeouts.has(key);
    }

    // Check if an interval exists
    hasInterval(key) {
        return this.intervals.has(key);
    }

    // Get the number of active timeouts
    size() {
        return this.timeouts.size;
    }

    // Get the number of active intervals
    intervalSize() {
        return this.intervals.size;
    }

    // Get all active timeout keys
    getTimeoutKeys() {
        return Array.from(this.timeouts.keys());
    }

    // Get all active interval keys
    getIntervalKeys() {
        return Array.from(this.intervals.keys());
    }

    // Get stats for debugging
    getStats() {
        return {
            timeouts: this.timeouts.size,
            intervals: this.intervals.size,
            total: this.timeouts.size + this.intervals.size,
            timeoutKeys: Array.from(this.timeouts.keys()),
            intervalKeys: Array.from(this.intervals.keys())
        };
    }
}

// WebGL context loss/restore handler
export class WebGLContextManager {
    constructor(canvas, onContextLost, onContextRestored) {
        this.canvas = canvas;
        this.onContextLost = onContextLost;
        this.onContextRestored = onContextRestored;
        this.isContextLost = false;
        
        // Bind event handlers to preserve 'this' context
        this.handleContextLoss = this.handleContextLoss.bind(this);
        this.handleContextRestore = this.handleContextRestore.bind(this);
        
        this.setup();
    }

    setup() {
        if (!this.canvas) {
            console.error('WebGLContextManager: No canvas provided');
            return;
        }

        this.canvas.addEventListener('webglcontextlost', this.handleContextLoss, false);
        this.canvas.addEventListener('webglcontextrestored', this.handleContextRestore, false);
        
        console.log('WebGLContextManager: Set up context loss/restore handlers');
    }

    handleContextLoss(event) {
        event.preventDefault();
        this.isContextLost = true;

        console.warn('WebGLContextManager: WebGL context lost');

        if (this.onContextLost && typeof this.onContextLost == 'function') {
            try {
                this.onContextLost(event);
            } catch (error) {
                console.error('WebGLContextManager: error in context lost callback: ', error);
            }
        }
    }

    handleContextRestore() {
        console.log('WebGLContextManager: WebGL context restored');
        this.isContextLost = false;
        
        if (this.onContextRestored && typeof this.onContextRestored === 'function') {
            try {
                this.onContextRestored();
            } catch (error) {
                console.error('WebGLContextManager: Error in context restore callback:', error);
            }
        }
    }

    dispose() {
        if (!this.canvas) return;
        
        this.canvas.removeEventListener('webglcontextlost', this.handleContextLoss, false);
        this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestore, false);
        
        console.log('WebGLContextManager: Disposed context handlers');
    }

    getContextLost() {
        return this.isContextLost;
    }

    // Manual context loss for testing
    loseContext() {
        if (this.canvas && this.canvas.getContext) {
            const gl = this.canvas.getContext('webgl') || this.canvas.getContext('webgl2');
            if (gl && gl.getExtension) {
                const ext = gl.getExtension('WEBGL_lose_context');
                if (ext) {
                    ext.loseContext();
                }
            }
        }
    }

    // Manual context restore for testing
    restoreContext() {
        if (this.canvas && this.canvas.getContext) {
            const gl = this.canvas.getContext('webgl') || this.canvas.getContext('webgl2');
            if (gl && gl.getExtension) {
                const ext = gl.getExtension('WEBGL_lose_context');
                if (ext) {
                    ext.restoreContext();
                }
            }
        }
    }
}
