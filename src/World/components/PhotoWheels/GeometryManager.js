import { Group, Mesh, Vector3, MathUtils } from 'three';
import { WHEEL_CONFIG, PHOTOS_DATA, ANIMATION_CONFIG, INTERACTION_CONFIG } from './config.js';

/**
 * Creates different types of meshes
 */
class MeshFactory {
    static createPhotoMesh(geometry, material, photoData, index, radianInterval) {
        const mesh = new Mesh(geometry, material);
        
        mesh.name = photoData;
        
        const angle = radianInterval * index;
        const x = Math.cos(angle) * WHEEL_CONFIG.RADIUS;
        const y = Math.sin(angle) * WHEEL_CONFIG.RADIUS;
        const z = 1;
        
        mesh.position.set(x, y, z);
        
        // Initialize user data for animations and state tracking
        mesh.userData = {
            originalPosition: mesh.position.clone(),
            baseRotationZ: 0,
            angle: angle,
            index: index,
            animationCache: {}
        };
        
        return mesh;
    }
}

/**
 * Animation interfaces with different implementations
 */
class AnimationTemplate {
    constructor(meshes) {
        this.meshes = meshes;
        this.isActive = false;
    }

    start(params = {}) {
        if (this.isActive) return false;
        this.isActive = true;
        this.onStart(params);
        return true;
    }

    stop() {
        if (!this.isActive) return false;
        this.isActive = false;
        this.onStop();
        return true;
    }

    update(progress, easing, params = {}) {
        if (!this.isActive) return;
        this.onUpdate(progress, easing, params);
    }

    onStart(params) {}
    onStop() {}
    onUpdate(progress, easing, params) {}
}


class HoverAnimation extends AnimationTemplate {
constructor(meshes, camera) {
        super(meshes);
        this.camera = camera;
        this.currentHovered = null;
        this.tiltVector = new Vector3();
    }

    updateHoverEffects(hoveredMesh, mouse) {
        this.currentHovered = hoveredMesh;
        
        for (const mesh of this.meshes) {
            if (mesh === hoveredMesh && hoveredMesh !== null) {
                this.applyHoverEffect(mesh, mouse);
            } else {
                this.removeHoverEffect(mesh);
            }
        }
    }

    applyHoverEffect(mesh, mouse) {
        if (!this.camera || !mouse) return;
        
        const lerpFactor = ANIMATION_CONFIG.LERP_FACTOR;
        
        // Scale effect - make hovered mesh slightly larger
        mesh.scale.set(
            MathUtils.lerp(mesh.scale.x, INTERACTION_CONFIG.HOVER_SCALE, lerpFactor * 1.25),
            MathUtils.lerp(mesh.scale.y, INTERACTION_CONFIG.HOVER_SCALE, lerpFactor * 1.25),
            MathUtils.lerp(mesh.scale.z, INTERACTION_CONFIG.HOVER_SCALE, lerpFactor * 1.25)
        );

        // Tilt effect - mesh tilts based on mouse position relative to its center
        mesh.getWorldPosition(this.tiltVector);
        this.tiltVector.project(this.camera);

        const offsetX = mouse.x - this.tiltVector.x;
        const offsetY = mouse.y - this.tiltVector.y;
        const normalizedX = MathUtils.clamp(offsetX / INTERACTION_CONFIG.PHOTO_SCREEN_SIZE, -1, 1);
        const normalizedY = MathUtils.clamp(offsetY / INTERACTION_CONFIG.PHOTO_SCREEN_SIZE, -1, 1);

        const tiltX = normalizedY * INTERACTION_CONFIG.MAX_TILT;
        const tiltY = normalizedX * INTERACTION_CONFIG.MAX_TILT;

        mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, tiltX, lerpFactor);
        mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, tiltY, lerpFactor);

        // Maintain base Z rotation (the wheel rotation)
        const targetZ = mesh.userData.baseRotationZ || 0;
        const zDiff = targetZ - mesh.rotation.z;
        
        if (Math.abs(zDiff) > Math.PI) {
            mesh.rotation.z = targetZ;
        } else if (Math.abs(zDiff) > 0.05) {
            mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, targetZ, lerpFactor * 0.5);
        }
    }

    removeHoverEffect(mesh) {
        const lerpFactor = ANIMATION_CONFIG.LERP_FACTOR;
        
        // Reset scale to normal
        mesh.scale.set(
            MathUtils.lerp(mesh.scale.x, 1, lerpFactor),
            MathUtils.lerp(mesh.scale.y, 1, lerpFactor),
            MathUtils.lerp(mesh.scale.z, 1, lerpFactor)
        );

        // Reset rotations
        mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, 0, lerpFactor);
        mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, 0, lerpFactor);

        // Restore base Z rotation
        const targetRotationZ = mesh.userData.baseRotationZ || 0;
        const rotationDiff = targetRotationZ - mesh.rotation.z;

        if (Math.abs(rotationDiff) > Math.PI) {
            mesh.rotation.z = targetRotationZ;
        } else {
            mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, targetRotationZ, lerpFactor);
        }
    }
}

/**
 * Handles the converge animation when a mesh is clicked
 */
class ConvergeAnimation extends AnimationTemplate {
    onStart(params) {
        const { clickedMesh, topWheel, bottomWheel } = params;
        this.clickedMesh = clickedMesh;
        this.cacheAnimationData(clickedMesh, topWheel, bottomWheel);
    }

    onUpdate(progress, easing, params) {
        // Animate all meshes except the clicked targets
        for (const mesh of this.meshes) {
            if (mesh.userData.animationCache.isTarget) continue;
            
            const cache = mesh.userData.animationCache;
            const currentAngle = cache.startAngle + (cache.angleDiff * easing);
            const newX = Math.cos(currentAngle) * cache.radius;
            const newY = Math.sin(currentAngle) * cache.radius;
            const newZ = cache.startZ + (cache.zDiff * easing);
            
            mesh.position.set(newX, newY, newZ);
        }
    }

    onStop() {
        // Clear animation cache when stopping
        for (const mesh of this.meshes) {
            mesh.userData.animationCache = {};
        }
        this.clickedMesh = null;
    }

    cacheAnimationData(clickedMesh, topWheel, bottomWheel) {
        // Determine which meshes are the targets (don't move during animation)
        const clickedInTopWheel = topWheel.children.includes(clickedMesh);
        let topTarget, bottomTarget;

        if (clickedInTopWheel) {
            topTarget = clickedMesh;
            const clickedIndex = topWheel.children.indexOf(clickedMesh);
            const totalPhotos = topWheel.children.length;
            const oppositeIndex = (clickedIndex + Math.floor(totalPhotos / 2)) % totalPhotos;
            bottomTarget = bottomWheel.children[oppositeIndex];
        } else {
            bottomTarget = clickedMesh;
            const clickedIndex = bottomWheel.children.indexOf(clickedMesh);
            const totalPhotos = bottomWheel.children.length;
            const oppositeIndex = (clickedIndex + Math.floor(totalPhotos / 2)) % totalPhotos;
            topTarget = topWheel.children[oppositeIndex];
        }

        // Pre-calculate animation data for all meshes
        for (const mesh of this.meshes) {
            if (mesh === topTarget || mesh === bottomTarget) {
                // Target meshes don't move
                mesh.userData.animationCache.isTarget = true;
                continue;
            }
            
            const isInTopWheel = topWheel.children.includes(mesh);
            const target = isInTopWheel ? topTarget : bottomTarget;
            
            // Calculate shortest path around the circle
            const startAngle = Math.atan2(mesh.position.y, mesh.position.x);
            const targetAngle = Math.atan2(target.position.y, target.position.x);
            
            let angleDiff = targetAngle - startAngle;
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Cache all animation parameters
            mesh.userData.animationCache = {
                isTarget: false,
                startAngle: startAngle,
                angleDiff: angleDiff,
                radius: WHEEL_CONFIG.RADIUS,
                startZ: mesh.position.z,
                targetZ: target.position.z + ANIMATION_CONFIG.STACK_OFFSET,
                zDiff: (target.position.z + ANIMATION_CONFIG.STACK_OFFSET) - mesh.position.z
            };
        }
    }
}

/**
 * Facade Pattern: GeometryManager provides a simple interface to complex mesh and animation management
 * This is the main class that coordinates everything
 */
export class GeometryManager {
    constructor(resourceManager) {
        this.resourceManager = resourceManager;
        
        // Core groups and meshes
        this.allPhotoMeshes = [];
        this.materials = [];
        this.topWheel = new Group();
        this.bottomWheel = new Group();
        this.photoWheels = new Group();
        
        // Reusable vectors for performance
        this.tempVector = new Vector3();
        this.tempVector2 = new Vector3();
        
        // Animation managers
        this.hoverAnimation = null;
        this.convergeAnimation = null;
        
        this.initialize();
    }

    initialize() {
        this.createPhotoMeshes();
        this.positionWheels();
        this.setupWheelGroup();
        this.setupAnimations();
    }

    createPhotoMeshes() {
        const geometry = this.resourceManager.createSharedGeometry();
        if (!geometry) {
            throw new Error('GeometryManager: Failed to create geometry');
        }

        const radianInterval = WHEEL_CONFIG.RADIAN_INTERVAL;

        for (let i = 0; i < PHOTOS_DATA.length; i++) {
            const photoData = PHOTOS_DATA[i];
            
            const texture = this.resourceManager.loadTexture(photoData.imagePath);
            if (!texture) {
                console.warn(`GeometryManager: Failed to load texture for ${photoData.imagePath}`);
                continue;
            }

            const material = this.resourceManager.createMaterial(texture);
            if (!material) {
                console.warn(`GeometryManager: Failed to create material for ${photoData.imagePath}`);
                continue;
            }

            this.materials.push(material);

            // Create meshes for both wheels (top and bottom)
            const topMesh = MeshFactory.createPhotoMesh(geometry, material, photoData, i, radianInterval);
            const bottomMesh = MeshFactory.createPhotoMesh(geometry, material, photoData, i, radianInterval);

            this.allPhotoMeshes.push(topMesh, bottomMesh);
            this.topWheel.add(topMesh);
            this.bottomWheel.add(bottomMesh);
        }

        console.log(`GeometryManager: Created ${this.allPhotoMeshes.length} photo meshes`);
    }

    positionWheels() {
        // Position the wheels vertically
        this.topWheel.translateY(WHEEL_CONFIG.POSITION + WHEEL_CONFIG.POSITION_OFFSET);
        this.bottomWheel.translateY(-WHEEL_CONFIG.POSITION + WHEEL_CONFIG.POSITION_OFFSET);
    }

    setupWheelGroup() {
        this.photoWheels.add(this.topWheel);
        this.photoWheels.add(this.bottomWheel);
    }

    setupAnimations() {
        this.hoverAnimation = new HoverAnimation(this.allPhotoMeshes, null); // Camera set later
        this.convergeAnimation = new ConvergeAnimation(this.allPhotoMeshes);
    }

    // Public API methods
    setCamera(camera) {
        if (this.hoverAnimation) {
            this.hoverAnimation.camera = camera;
        }
    }

    rotateWheels(angle) {
        if (Math.abs(angle) < 0.001) return; // Skip tiny rotations for performance
        
        // Rotate the wheel groups
        this.topWheel.rotateZ(angle);
        this.bottomWheel.rotateZ(angle);
        
        // Counter-rotate individual meshes to keep them upright
        for (const mesh of this.allPhotoMeshes) {
            mesh.rotateZ(-angle);
            mesh.userData.baseRotationZ = this.normalizeRotation(mesh.rotation.z);
        }
    }

    calculateSnapAngle() {
        // Use the 5th child (index 4) as snap reference point
        const referenceChild = this.topWheel.children[4];
        if (!referenceChild) {
            return { angle: 0, closestMesh: null };
        }

        const snapPoint = {
            x: referenceChild.position.x,
            y: referenceChild.position.y
        };
        
        let closestMesh = null;
        let closestDistance = Infinity;
        let closestWorldPos = new Vector3();

        // Find the mesh closest to the snap point
        for (const element of this.topWheel.children) {
            this.tempVector.setFromMatrixPosition(element.matrixWorld);
            
            const dx = this.tempVector.x - snapPoint.x;
            const dy = this.tempVector.y - snapPoint.y;
            const distance = dx * dx + dy * dy; // Using squared distance for performance

            if (distance < closestDistance) {
                closestDistance = distance;
                closestWorldPos.copy(this.tempVector);
                closestMesh = element;
            }
        }

        if (!closestMesh) {
            return { angle: 0, closestMesh: null };
        }

        // Calculate the angle needed to align closest mesh with snap point
        const targetVector = new Vector3().subVectors(closestWorldPos, this.topWheel.position);
        const referenceVector = new Vector3().subVectors(
            new Vector3(snapPoint.x, snapPoint.y, 0), 
            this.topWheel.position
        );
        
        // Calculate angle between vectors
        const angle = targetVector.angleTo(referenceVector);
        
        // Determine direction using cross product
        const cross = new Vector3().crossVectors(referenceVector, targetVector);
        const snapAngle = cross.z > 0 ? -angle : angle;

        return { angle: snapAngle, closestMesh: closestMesh };
    }

    updateHover(hoveredMesh, mouse) {
        if (this.hoverAnimation) {
            this.hoverAnimation.updateHoverEffects(hoveredMesh, mouse);
        }
    }

    startConvergeAnimation(clickedMesh) {
        return this.convergeAnimation.start({
            clickedMesh,
            topWheel: this.topWheel,
            bottomWheel: this.bottomWheel
        });
    }

    updateConvergeAnimation(progress, easing) {
        this.convergeAnimation.update(progress, easing);
    }

    stopConvergeAnimation() {
        this.convergeAnimation.stop();
    }

    resetMeshToOriginalState(mesh) {
        // Reset position to original
        if (mesh.userData.originalPosition) {
            mesh.position.copy(mesh.userData.originalPosition);
        }
        
        // Reset transformations
        mesh.scale.set(1, 1, 1);
        mesh.rotation.x = 0;
        mesh.rotation.y = 0;
        mesh.rotation.z = mesh.userData.baseRotationZ || 0;
        
        // Clear animation cache
        mesh.userData.animationCache = {};
    }

    resetAllMeshes() {
        for (const mesh of this.allPhotoMeshes) {
            this.resetMeshToOriginalState(mesh);
        }
    }

    // Utility methods
    normalizeRotation(rotation) {
        // Keep rotations between 0 and 2π to prevent precision drift
        return ((rotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
    }

    performMaintenance() {
        // Normalize rotations to prevent precision drift over time
        for (const mesh of this.allPhotoMeshes) {
            if (mesh.userData.baseRotationZ !== undefined) {
                mesh.userData.baseRotationZ = this.normalizeRotation(mesh.userData.baseRotationZ);
            }
        }
    }

    // Getters for external access
    getAllMeshes() {
        return this.allPhotoMeshes;
    }

    getWheelGroup() {
        return this.photoWheels;
    }

    getTopWheel() {
        return this.topWheel;
    }

    getBottomWheel() {
        return this.bottomWheel;
    }

    // Cleanup
    dispose() {
        this.hoverAnimation = null;
        this.convergeAnimation?.stop();
        this.convergeAnimation = null;
        
        this.allPhotoMeshes.length = 0;
        this.materials.length = 0;
    }
}