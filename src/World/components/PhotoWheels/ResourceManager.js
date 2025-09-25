// ResourceManager.js - Handles texture, material, and geometry cleanup
import { SRGBColorSpace, TextureLoader } from 'three';
import { createMaterial } from '../material.js';
import { RoundedRectangle } from '../geometry.js';
import { GEOMETRY_CONFIG } from './config.js';

export class ResourceManager {
    constructor() {
        this.texturesToDispose = [];
        this.materialsToDispose = [];
        this.geometriesToDispose = [];
        this.textureLoader = new TextureLoader();
        this.sharedGeometry = null;
        this.isDisposed = false;
        
        // Track loading promises for better error handling
        this.loadingPromises = new Map();

        this.activeTextures = new Set();
        this.activeMaterials = new Set();
        this.activeGeometries = new Set();
    }

    createSharedGeometry() {
        if (this.sharedGeometry) return this.sharedGeometry;
        
        try {
            this.sharedGeometry = RoundedRectangle(
                GEOMETRY_CONFIG.SIZE,
                GEOMETRY_CONFIG.SIZE,
                GEOMETRY_CONFIG.CORNER_RADIUS,
                GEOMETRY_CONFIG.CORNER_SMOOTHNESS
            );
            
            this.geometriesToDispose.push(this.sharedGeometry);
            this.activeGeometries.add(this.sharedGeometry);
            return this.sharedGeometry;
        } catch (error) {
            console.error('ResourceManager: Failed to create shared geometry:', error);
            return null;
        }
    }

    loadTexture(imagePath) {
        if (this.isDisposed) {
            console.warn('ResourceManager: Attempting to load texture after disposal');
            return null;
        }

        // Return existing promise if already loading this texture
        if (this.loadingPromises.has(imagePath)) {
            return this.loadingPromises.get(imagePath);
        }

        try {
            const texture = this.textureLoader.load(
                imagePath,
                // onLoad callback
                (loadedTexture) => {
                    console.log(`ResourceManager: Successfully loaded ${imagePath}`);
                    this.loadingPromises.delete(imagePath);
                },
                // onProgress callback
                (progress) => {
                    // Optional: could emit loading progress events
                },
                // onError callback
                (error) => {
                    console.error(`ResourceManager: Failed to load texture: ${imagePath}`, error);
                    this.loadingPromises.delete(imagePath);
                }
            );
            
            texture.colorSpace = SRGBColorSpace;
            this.texturesToDispose.push(texture);
            this.activeTextures.add(texture);
            
            // Store loading promise for deduplication
            const loadingPromise = Promise.resolve(texture);
            this.loadingPromises.set(imagePath, loadingPromise);
            
            return texture;
        } catch (error) {
            console.error(`ResourceManager: Error creating texture loader for ${imagePath}:`, error);
            return null;
        }
    }

    createMaterial(texture) {
        if (!texture) {
            console.warn('ResourceManager: Cannot create material - no texture provided');
            return null;
        }
        
        if (this.isDisposed) {
            console.warn('ResourceManager: Attempting to create material after disposal');
            return null;
        }
        
        try {
            const material = createMaterial(texture);
            this.materialsToDispose.push(material);
            this.activeMaterials.add(material);
            return material;
        } catch (error) {
            console.error('ResourceManager: Error creating material:', error);
            return null;
        }
    }

    markResourceInactive(resource) {
        if (!resource) return;
        
        this.activeTextures.delete(resource);
        this.activeMaterials.delete(resource);
        this.activeGeometries.delete(resource);
    }

    // Batch create textures and materials for better performance
    async loadTexturesAndMaterials(imagePaths) {
        const results = [];
        
        for (const imagePath of imagePaths) {
            const texture = this.loadTexture(imagePath);
            const material = this.createMaterial(texture);
            
            results.push({
                imagePath,
                texture,
                material,
                success: texture !== null && material !== null
            });
        }
        
        return results;
    }

    // Performs periodic cleanup to prevent memory leaks
    performMaintenanceCleanup() {
        if (this.isDisposed) return;
        
        console.log('ResourceManager: Performing maintenance cleanup...');
        
        // Trigger garbage collection if available (development only)
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
                console.log('ResourceManager: Manual garbage collection triggered');
            } catch (error) {
                // Ignore errors - gc might not be available
            }
        }

        // Clean up any null references
        this.texturesToDispose = this.texturesToDispose.filter(texture => {
            if (!texture || typeof texture.dispose !== 'function') {
                console.warn('ResourceManager: Found invalid texture reference during cleanup');
                return false;
            }
            return true;
        });
        
        this.materialsToDispose = this.materialsToDispose.filter(material => {
            if (!material || typeof material.dispose !== 'function') {
                console.warn('ResourceManager: Found invalid material reference during cleanup');
                return false;
            }
            return true;
        });
        
        this.geometriesToDispose = this.geometriesToDispose.filter(geometry => {
            if (!geometry || typeof geometry.dispose !== 'function') {
                console.warn('ResourceManager: Found invalid geometry reference during cleanup');
                return false;
            }
            return true;
        });

        // Clear completed loading promises
        for (const [imagePath, promise] of this.loadingPromises.entries()) {
            Promise.resolve(promise).then(() => {
                this.loadingPromises.delete(imagePath);
            }).catch(() => {
                this.loadingPromises.delete(imagePath);
            });
        }

        console.log(`ResourceManager: Maintenance complete. Tracking ${this.getResourceStats().total} resources`);
    }

    // Dispose of all resources
    dispose() {
        if (this.isDisposed) {
            console.warn('ResourceManager: Already disposed');
            return;
        }
        
        console.log('ResourceManager: Disposing all resources...');

        this.activeTextures.clear();
        this.activeMaterials.clear();
        this.activeGeometries.clear();
        
        let disposedCount = 0;
        
        // Dispose textures
        this.texturesToDispose.forEach(texture => {
            if (texture && typeof texture.dispose === 'function') {
                try {
                    texture.dispose();
                    disposedCount++;
                } catch (error) {
                    console.warn('ResourceManager: Error disposing texture:', error);
                }
            }
        });

        // Dispose materials
        this.materialsToDispose.forEach(material => {
            if (material && typeof material.dispose === 'function') {
                try {
                    material.dispose();
                    disposedCount++;
                } catch (error) {
                    console.warn('ResourceManager: Error disposing material:', error);
                }
            }
        });

        // Dispose geometries
        this.geometriesToDispose.forEach(geometry => {
            if (geometry && typeof geometry.dispose === 'function') {
                try {
                    geometry.dispose();
                    disposedCount++;
                } catch (error) {
                    console.warn('ResourceManager: Error disposing geometry:', error);
                }
            }
        });

        // Clear all arrays
        this.texturesToDispose.length = 0;
        this.materialsToDispose.length = 0;
        this.geometriesToDispose.length = 0;
        
        // Clear loading promises
        this.loadingPromises.clear();
        
        // Clear references
        this.sharedGeometry = null;
        this.textureLoader = null;
        this.isDisposed = true;
        
        console.log(`ResourceManager: Successfully disposed ${disposedCount} resources`);
    }

    // Force dispose a specific resource
    // disposeResource(resource) {
    //     if (!resource || typeof resource.dispose !== 'function') {
    //         console.warn('ResourceManager: Cannot dispose invalid resource');
    //         return false;
    //     }

    //     try {
    //         // Remove from tracking arrays
    //         const textureIndex = this.texturesToDispose.indexOf(resource);
    //         if (textureIndex > -1) {
    //             this.texturesToDispose.splice(textureIndex, 1);
    //         }
            
    //         const materialIndex = this.materialsToDispose.indexOf(resource);
    //         if (materialIndex > -1) {
    //             this.materialsToDispose.splice(materialIndex, 1);
    //         }
            
    //         const geometryIndex = this.geometriesToDispose.indexOf(resource);
    //         if (geometryIndex > -1) {
    //             this.geometriesToDispose.splice(geometryIndex, 1);
    //         }

    //         // Dispose the resource
    //         resource.dispose();
    //         console.log('ResourceManager: Successfully disposed individual resource');
    //         return true;
    //     } catch (error) {
    //         console.error('ResourceManager: Error disposing individual resource:', error);
    //         return false;
    //     }
    // }

    safeDisposeResource(resource) {
        if (!resource || typeof resource.dispose !== 'function') {
            return false;
        }

        // Check if resource is still active
        if (this.activeTextures.has(resource) || 
            this.activeMaterials.has(resource) || 
            this.activeGeometries.has(resource)) {
            console.warn('ResourceManager: Attempting to dispose active resource - skipping');
            return false;
        }

        try {
            resource.dispose();
            
            // Remove from tracking arrays
            const textureIndex = this.texturesToDispose.indexOf(resource);
            if (textureIndex > -1) {
                this.texturesToDispose.splice(textureIndex, 1);
            }
            
            const materialIndex = this.materialsToDispose.indexOf(resource);
            if (materialIndex > -1) {
                this.materialsToDispose.splice(materialIndex, 1);
            }
            
            const geometryIndex = this.geometriesToDispose.indexOf(resource);
            if (geometryIndex > -1) {
                this.geometriesToDispose.splice(geometryIndex, 1);
            }

            return true;
        } catch (error) {
            console.error('ResourceManager: Error disposing resource:', error);
            return false;
        }
    }

    // Get resource usage stats for debugging
    getResourceStats() {
        return {
            textures: this.texturesToDispose.length,
            materials: this.materialsToDispose.length,
            geometries: this.geometriesToDispose.length,
            activeTextures: this.activeTextures.size,
            activeMaterials: this.activeMaterials.size,
            activeGeometries: this.activeGeometries.size,
            loadingPromises: this.loadingPromises.size,
            total: this.texturesToDispose.length + this.materialsToDispose.length + this.geometriesToDispose.length,
            isDisposed: this.isDisposed
        };
    }

    // Check if resource manager is healthy
    isHealthy() {
        return !this.isDisposed && 
               this.textureLoader !== null && 
               this.texturesToDispose.length < 1000 && 
               this.materialsToDispose.length < 1000 &&
               this.geometriesToDispose.length < 100;
    }

    // Get memory usage estimate (rough approximation)
    getMemoryEstimate() {
        const textureMemory = this.texturesToDispose.length * 1024 * 1024; // Rough estimate: 1MB per texture
        const materialMemory = this.materialsToDispose.length * 1024; // Rough estimate: 1KB per material
        const geometryMemory = this.geometriesToDispose.length * 512 * 1024; // Rough estimate: 512KB per geometry
        
        return {
            textures: textureMemory,
            materials: materialMemory,
            geometries: geometryMemory,
            total: textureMemory + materialMemory + geometryMemory,
            unit: 'bytes'
        };
    }
}

// Auto-disposal utility function
export function setupAutoDisposal(resourceManager, options = {}) {
    const {
        delayMs = 30000, // 30 seconds default
    } = options;

    let autoDisposeTimeout;
    
    const handlePageHide = () => {
        autoDisposeTimeout = setTimeout(() => {
            if (document.hidden && !resourceManager.isDisposed) {
                console.log('ResourceManager: Page hidden for extended period - auto-disposing resources');
                resourceManager.dispose();
            }
        }, delayMs);
    };

    const handlePageShow = () => {
        if (autoDisposeTimeout) {
            clearTimeout(autoDisposeTimeout);
            autoDisposeTimeout = null;
        }
    };

    // Set up event listeners - REMOVED memory pressure monitoring
    document.addEventListener('pagehide', handlePageHide);
    document.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            handlePageHide();
        } else {
            handlePageShow();
        }
    });

    // Return cleanup function
    return () => {
        document.removeEventListener('pagehide', handlePageHide);
        document.removeEventListener('pageshow', handlePageShow);
        
        if (autoDisposeTimeout) {
            clearTimeout(autoDisposeTimeout);
        }
    };
}