import HomeExperience from '../../HomeExperience.js';
import { createTexture } from './texture.js'
import { createMaterial } from './material.js';
import { createGeometry } from './geometry.js';
import { createMesh } from './mesh.js';
import {
    GEOMETRY_CONFIG,
    PHOTOS_DATA,
    WHEEL_CONFIG,
    ANIMATION_CONFIG,
    INTERACTION_CONFIG,
    SCROLL_CONFIG,
} from '../config.js';
import {
    Group,
    MathUtils,
    Raycaster,
    TextureLoader,
    Vector2,
    Vector3,
} from 'three';


export default class PhotoWheels {

    constructor() {
        this.experience = new HomeExperience();
        this.initializeState();
        this.initializeScene();
        this.setupEventListeners();
    }


    initializeState() {
        /* *** Scene Objects *** */
        this.textureLoader = new TextureLoader();
        this.materials = [];
        this.texturesToDispose = [];
        this.materialsToDispose = [];
        this.allPhotoMeshes = [];
        this.topWheel = new Group();
        this.bottomWheel = new Group();
        this.roundedRectangleGeometry = null;

        /* *** Scroll/Wheel Animation *** */
        this.targetVelocity = 0;
        this.currentVelocity = 0;
        this.spinTimeout = null;

        /* *** Touch/Swipe *** */
        this.xDown = null;
        this.yDown = null;

        /* *** Mouse State *** */
        this.mouse = new Vector2();
        this.mouseMovedSinceLastCheck = false;
        this.lastHoverCheck = 0;
        this.lastMouseMoveTime = 0;
        this.tiltVector = new Vector3()

        /* *** Drag State *** */
        this.isDragging = false;
        this.dragDidMove = false;
        this.dragStartPosition = new Vector2();
        this.dragCurrentPosition = new Vector2();
        this.dragVelocityHistory = [];
        this.lastDragTime = 0;

        /* *** Hover State *** */
        this.isHovering = false;
        this.hoveredItem = null;
        this.raycaster = new Raycaster();

        /* *** Keyboard State *** */
        this.isKeyPressed = false;
        this.pressedKeys = new Set();
        this.isStepRotating = false;
        this.stepRotationTarget = 0;
        this.stepRotationProgress = 0;
        this.stepRotationVelocity = 0;

        /* *** Snapping Animation State *** */
        this.isSnapping = false;
        this.snapStartRotation = 0;
        this.snapTargetRotation = 0;
        this.snapProgress = 0;
        this.springVelocity = 0;
        this.springDamping = ANIMATION_CONFIG.INITIAL_SPRING_DAMPING;
        this.springStiffness = ANIMATION_CONFIG.INITIAL_SPRING_STIFFNESS;
        this.tempVector = new Vector3();
        this.snapPoint = { x: 0, y: 0, theta: 0 };

        /* *** Converge Animation State *** */
        this.isConverging = false;
        this.convergeProgress = 0;

        /* *** Context/Visibility State *** */
        this.isContextLost = false;
    }


    initializeScene() {
        // Geometry
        this.roundedRectangleGeometry = createGeometry(
            GEOMETRY_CONFIG.SIZE,
            GEOMETRY_CONFIG.SIZE,
            GEOMETRY_CONFIG.CORNER_RADIUS,
            GEOMETRY_CONFIG.CORNER_SMOOTHNESS
        );

        this.createPhotoMeshes();
        this.positionWheels();
        this.saveOriginalMeshPositions();
        this.createWheelGroup();
    }

    createPhotoMeshes() {
        for (let i = 0; i < PHOTOS_DATA.length; i++) {
            // Create texture
            const texture = createTexture(this.textureLoader, PHOTOS_DATA[i].imagePath);
            this.texturesToDispose.push(texture);
            // Create material
            const material = createMaterial(texture, this.experience.lights);
            this.materials.push(material);
            this.materialsToDispose.push(material);
            // Create mesh
            const photoMeshTop = createMesh(this.roundedRectangleGeometry, this.materials[i], PHOTOS_DATA[i], i);
            const photoMeshBottom = createMesh(this.roundedRectangleGeometry, this.materials[i], PHOTOS_DATA[i], i);
            // Add to Group
            this.allPhotoMeshes.push(photoMeshTop, photoMeshBottom);
            this.topWheel.add(photoMeshTop);
            this.bottomWheel.add(photoMeshBottom);
        }
    }

    positionWheels() {
        this.topWheel.translateY(
            WHEEL_CONFIG.POSITION + WHEEL_CONFIG.POSITION_OFFSET
        );
        this.bottomWheel.translateY(
            -WHEEL_CONFIG.POSITION + WHEEL_CONFIG.POSITION_OFFSET
        );
    }
    
    saveOriginalMeshPositions() {
        for (let i = 0; i < this.allPhotoMeshes.length; i++) {
            const mesh = this.allPhotoMeshes[i];
            mesh.userData.originalPosition = mesh.position.clone();
        }
    }

    createWheelGroup() {
        this.instance = new Group();
        this.instance.add(this.topWheel, this.bottomWheel);
    }


    setupEventListeners() {
        this.experience.container.addEventListener('mousemove', this.handleMouseMove);
        this.experience.container.addEventListener('click', this.handleMouseClick);
        this.experience.container.addEventListener('mousedown', this.handleMouseDown);
        
        document.addEventListener('wheel', this.handleWheelEvent);
        document.addEventListener('touchstart', this.handleTouchStart, false);
        document.addEventListener('touchmove', this.handleTouchMove);
        document.addEventListener('touchend', this.handleTouchEnd);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        document.addEventListener('pageshow', this.handlePageShow);
        document.addEventListener('pagehide', this.handlePageHide);
    }

    
    /* *** Event Listeners *** */
    handleMouseMove = (event) => {
        // Throttle mouse move events for performance
        const now = performance.now();
        if (now - this.lastMouseMoveTime < 16) return;

        // Update state variables
        this.lastMouseMoveTime = now;
        this.mouseMovedSinceLastCheck = true;

        // Normalize mouse coordinates
        this.mouse.x = event.clientX / window.innerWidth * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight * 2 - 1);
        
        if (this.isDragging) {
            this.handleMouseDrag(event);
        }
    }


    handleMouseDrag = (event) => {
        const now = performance.now()
        const deltaTime = now - this.lastDragTime;

        this.dragCurrentPosition.x = event.clientX;
        this.dragCurrentPosition.y = event.clientY;

        const deltaX = this.dragCurrentPosition.x - this.dragStartPosition.x;
        const sensitivity = 4000;
        let angleDiff = (deltaX / sensitivity) * Math.PI * 2;
        
        // Handle angle wrapping around -π to π
        this.dragStartPosition.x = this.dragCurrentPosition.x;
        this.dragStartPosition.y = this.dragCurrentPosition.y;

        // If dragging mouse above threshold
        if (Math.abs(angleDiff) > 0.001) {
            // Update state variable
            this.dragDidMove = true;

            const maxDragSpeed = 0.075;
            angleDiff = Math.max(-maxDragSpeed, Math.min(maxDragSpeed, angleDiff));

            this.rotateWheels(angleDiff);

            if (deltaTime > 0) {
                const angularVelocity  = angleDiff / (deltaTime * 1000);
                this.dragVelocityHistory.push({
                    velocity: angularVelocity,
                    time: now,
                });

                if (this.dragVelocityHistory.length > INTERACTION_CONFIG.VELOCITY_HISTORY_LENGTH) {
                    this.dragVelocityHistory.shift();
                }
            }
        }

        this.lastDragTime = now;

        event.preventDefault();
    }


    handleMouseClick = () => {
        // Do nothing if dragging
        if (this.dragDidMove) {
            this.dragDidMove = false;
            return;
        }

        // If hovering and wheel not moving too fast
        if (this.isHovering && Math.abs(this.currentVelocity) < INTERACTION_CONFIG.VELOCITY_CLICK_THRESHOLD) {
            if (this.isSnapping) {
                setTimeout(() => {
                    if (this.isHovering) {
                        this.executeClick()
                    }
                }, 100);
            } else {
                this.executeClick();
            }
        } 
    }


    handleMouseDown = (event) => {
        // Do nothing if wheels are converging
        if (this.isConverging) return;

        this.stopSnapAnimation();
        this.stopStepRotation();

        this.isDragging = true;
        this.dragDidMove = false;

        this.dragStartPosition.x = event.clientX;
        this.dragStartPosition.y = event.clientY;

        this.dragCurrentPosition.x = event.clientX;
        this.dragCurrentPosition.y = event.clientY;

        this.dragVelocityHistory.length = 0;
        this.lastDragTime = performance.now();

        document.body.style.cursor = "grabbing";

        event.preventDefault();
    }


    handleWheelEvent = (event) => {
        // Do nothing if wheels are converging
        if (this.isConverging) return;

        // Prevent wheels from snapping
        this.isSnapping = false
        clearTimeout(this.spinTimeout);

        if (this.isHovering) {
            this.resetHoverScale()
        }

        const scroll = event.deltaY;
        const scrollIntensity = Math.abs(scroll) / SCROLL_CONFIG.INTENSITY_DIVISOR;
        let velocityChange = Math.min(
            scrollIntensity * SCROLL_CONFIG.BASE_VELOCITY_CHANGE, 
            SCROLL_CONFIG.MAX_VELOCITY_CHANGE
        );

        if (Math.abs(scroll) < SCROLL_CONFIG.TRACKPAD_THRESHOLD) {
            // Scroll speed indicates trackpad, apply trackpad scroll multiplier
            velocityChange *= SCROLL_CONFIG.TRACKPAD_MULTIPLIER;

            // Snap after spinTimeout
            clearTimeout(this.spinTimeout);
            this.spinTimeout = setTimeout(() => {
                this.startSnapAnimation()
                setTimeout(() => this.forceHoverCheck(), SCROLL_CONFIG.TRACKPAD_THRESHOLD);
            }, SCROLL_CONFIG.TRACKPAD_SNAP_DELAY);
        } else {
            // Scroll speed indicates mouse wheel
            clearTimeout(this.spinTimeout);

            this.spinTimeout = setTimeout(() => {
                this.startSnapAnimation()
                setTimeout(() => this.forceHoverCheck(), 50);
            }, SCROLL_CONFIG.MOUSE_WHEEL_SNAP_DELAY);
        }

        // Determine scroll direction
        if (scroll > 0) {
            this.targetVelocity -= velocityChange;
        } else {
            this.targetVelocity += velocityChange;
        }

        this.targetVelocity = this.clampVelocity(this.targetVelocity);
    }
    

    handleTouchStart = (event) => {
        // Do nothing if wheels are converging
        if(this.isConverging) return;

        // Prevent wheels from snapping
        this.isSnapping = false
        clearTimeout(this.spinTimeout);

        const firstTouch = event.touches[0];                                      
        this.xDown = firstTouch.clientX;                                      
        this.yDown = firstTouch.clientY; 
    }


    handleTouchMove = (event) => {
        if (!this.xDown || !this.yDown) return;

        let xUp = event.touches[0].clientX;                                    
        let yUp = event.touches[0].clientY;
        let xDiff = this.xDown - xUp;
        let yDiff = this.yDown - yUp;

        let swipeSpeed = Math.sqrt(( Math.pow(xDiff, 2) + Math.pow(yDiff, 2) )) / SCROLL_CONFIG.SWIPE_DIVISOR;
        swipeSpeed = Math.min(swipeSpeed, SCROLL_CONFIG.MAX_SWIPE_SPEED);

        // Determine swipe direction
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            this.targetVelocity = xDiff > 0 ? -swipeSpeed : swipeSpeed;
        } else {
            this.targetVelocity = yDiff > 0 ? swipeSpeed : -swipeSpeed;
        }                                                               

        this.targetVelocity = this.clampVelocity(this.targetVelocity);

        // Reset the swipeSpeed calculation so the wheels don't accelerate
        this.xDown = xUp;
        this.yDown = yUp;

        clearTimeout(this.spinTimeout);
        this.spinTimeout = setTimeout(this.startSnapAnimation, SCROLL_CONFIG.SWIPE_SNAP_DELAY);
    }


    handleTouchEnd = () => {
        this.xDown = null;
        this.yDown = null;
    }


    handleMouseUp = (event) => {
        this.isDragging = false;
        document.body.style.cursor = 'default';

        const now = performance.now();
        let releaseVelocity = 0;

        // Calculate average velocity from recent drag samples for momentum
        if (this.dragVelocityHistory.length > 0) {

            // Only use very recent samples (last 100ms)
            const recentSamples = this.dragVelocityHistory.filter((sum, sample) => {
                now - sample.time < 100;
            });

            if (recentSamples.length > 0) {
                const avgVelocity = recentSamples.reduce((sum, sample) => 
                    sum + sample.velocity, 0
                ) / recentSamples.length;

                releaseVelocity = avgVelocity;
            }

            releaseVelocity = this.clampVelocity(releaseVelocity);
        }

        // If released with significant velocity, apply momentum
        if (Math.abs(releaseVelocity) > 0.005) {
            this.targetVelocity = releaseVelocity;
            
            clearTimeout(this.spinTimeout);
            // Wait longer before snapping to allow momentum to play out
            this.spinTimeout = setTimeout(() => {
                this.startSnapAnimation();
                setTimeout(() => this.forceHoverCheck(), 50);
            }, 800); 
        } else {
            // No momentum - snap immediately
            setTimeout(() => {
                this.startSnapAnimation();
                setTimeout(() => this.forceHoverCheck(), 50);
            }, 100);
        }
        
        this.dragVelocityHistory.length = 0;
        event.preventDefault();
    }


    handleKeyDown = (event) => {
        // Do nothing if converging
        if (this.isConverging) return;
        
        // Only care about arrow and enter keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(event.code)) {
            event.preventDefault();

        } else if (event.code == 'Enter') {
            this.handleEnterKey();
            return;

        } else {
            return;
        }

        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            if (!this.pressedKeys.has(event.code)) {
                this.pressedKeys.add(event.code);
                this.isKeyPressed = true;
                
                this.stopSnapAnimation();
                this.stopStepRotation();
                
                if (this.isHovering) {
                    this.resetHoverScale();
                }
            }
        }

        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            if (!this.pressedKeys.has(event.code)) {
                this.pressedKeys.add(event.code);
                
                this.stopSnapAnimation();
                
                this.isStepRotating = true;
                this.stepRotationProgress = 0;
                this.stepRotationVelocity = 0;
                
                // Calculate rotation amount: one radian interval plus extra for spring effect
                const baseRotation = WHEEL_CONFIG.RADIAN_INTERVAL;
                const totalRotation = baseRotation + SCROLL_CONFIG.KEY_STEP_ROTATION_EXTRA;
                
                if (event.code === 'ArrowLeft') {
                    this.stepRotationTarget = totalRotation;
                } else {
                    this.stepRotationTarget = -totalRotation;
                }
            }
        }
    }


    handleKeyUp = (event) => {
        if (event.code === 'Enter') return;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
            event.preventDefault();
        }

        this.pressedKeys.delete(event.code);

        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            if (!this.pressedKeys.has('ArrowUp') && !this.pressedKeys.has('ArrowDown')) {
                this.isKeyPressed = false;
                
                // Start snap animation similar to scroll/swipe end
                setTimeout(() => {
                    this.startSnapAnimation();
                    setTimeout(() => this.forceHoverCheck(), 50);
                }, 100);
            }
        }
    }


    handleEnterKey = () => {
        // Do nothing if other animation state is active
        if ( this.isConverging || this.isSnapping || this.isStepRotating || this.isKeyPressed ) {
            return;
        }

        // Do nothing if moving too fast
        if (Math.abs(this.currentVelocity) > ANIMATION_CONFIG.VELOCITY_THRESHOLD ||
            Math.abs(this.targetVelocity) > ANIMATION_CONFIG.VELOCITY_THRESHOLD ) {
            return;
        }

        const snapData = this.calculateSnapAngle(this.topWheel);

        if ( !snapData.closestMesh || Math.abs(snapData.angle) > 0.05) {
            return;
        }

        this.startConvergeAnimation(snapData.closestMesh);
    }


    handleVisibilityChange = () => {
        if (document.hidden && this.isConverging) {
            this.endConvergeAnimation();
        }

        this.resetAllMeshToOriginalState();
    }


    handlePageShow = (event) => {
        if (event.persisted) {
            this.endConvergeAnimation();

            this.isSnapping = false;
            this.targetVelocity = 0;
            this.currentVelocity = 0;
            this.convergeProgress = 0;

            this.resetAllMeshToOriginalState();
        }
    }

    
    handlePageHide = () => {
        if (this.isConverging) {
            this.endConvergeAnimation();
        }
        clearTimeout(this.spinTimeout);

        // Dispose resources when page is hidden for 30s
        setTimeout(() => {
            if (document.hidden) {
                console.log('Page hidden - disposing resources');
                this.disposeResources();
            }
        }, 30000);
    }


    handleContextLoss = (event) => {
        event.preventDefault();
        this.isContextLost = true;
        console.warn('WebGL context lost - pausing animations');

        if (this.isConverging) {
            this.endConvergeAnimation();
        }

        this.stopSnapAnimation();
    }


    handleContextRestored = () => {
        this.isContextLost = false;
    }



    /* *** Utility Methods *** */

    resetHoverScale() {
        for (let i = 0; i < this.allPhotoMeshes.length; i++) {
            this.allPhotoMeshes[i].scale.set(1, 1, 1);
        }
    }


    clampVelocity(velocity) {
        // [-MAX_VELOCITY, MAX_VELOCITY]
        return Math.max(-ANIMATION_CONFIG.MAX_VELOCITY, Math.min(ANIMATION_CONFIG.MAX_VELOCITY, velocity));
    }


    executeClick() {
        if (!this.isConverging) {
            this.startConvergeAnimation(this.hoveredItem);
        } else {
            window.location.href = this.hoveredItem.name.projectPath;
        }
    }


    resetAllMeshUserData() {
        for (let i = 0; i < this.allPhotoMeshes.length; i++) {
            this.resetMeshUserData(this.allPhotoMeshes[i]);
        }
    }


    resetMeshUserData(mesh) {
        delete mesh.userData.isTarget;
        delete mesh.userData.cachedTarget;
        delete mesh.userData.startAngle;
        delete mesh.userData.angleDiff;
        delete mesh.userData.radius;
        delete mesh.userData.startZ;
        delete mesh.userData.targetZ;
        delete mesh.userData.zDiff;
        delete mesh.userData.startPosition;
    }


    resetAllMeshToOriginalState() {
        for (let i = 0; i < this.allPhotoMeshes.length; i++) {
            this.resetMeshState(this.allPhotoMeshes[i]);
        }
    }


    resetMeshState(mesh) {
        if (mesh.userData.originalPosition) {
            mesh.position.copy(mesh.userData.originalPosition);
        }
        
        mesh.scale.set(1, 1, 1);
        mesh.rotation.x = 0;
        mesh.rotation.y = 0;
        mesh.rotation.z = mesh.userData.baseRotationZ || 0;
        
        this.resetMeshUserData(mesh);
    }


    calculateSnapAngle (wheel) {
        const snapPoint = {
            x: wheel.children[4].position.x,
            y: wheel.children[4].position.y,
            theta: 0
        };

        // Calculate angle of snap point relative to wheel center
        snapPoint.theta = Math.atan2(
            Math.abs(snapPoint.y - wheel.position.y), 
            Math.abs(snapPoint.x - wheel.position.x)
        );
        
        let closestMesh = null;
        let closestX = 0.0;
        let closestY = 0.0;
        let shortestDistance = Infinity

        const tempVector = new Vector3();

        // Determine mesh with the shortest square distance to snap point 
        for (let i = 0; i < this.topWheel.children.length; i++) {
            const element = this.topWheel.children[i];
            tempVector.setFromMatrixPosition(element.matrixWorld);

            
            let dx = tempVector.x - snapPoint.x;
            let dy = tempVector.y - snapPoint.y;
            let currentDistance = dx * dx + dy * dy;

            if (currentDistance < shortestDistance) {
                shortestDistance = currentDistance;
                closestX = tempVector.x;
                closestY = tempVector.y;
                closestMesh = element;
            }
        }

        let angleOfClosestMesh = Math.atan2(
            Math.abs(closestY - wheel.position.y), 
            Math.abs(closestX - wheel.position.x)
        );
        let snapAngle = Math.abs(angleOfClosestMesh - snapPoint.theta);

        // Determines whether the wheels need to be rotated cw or ccw based on the cartesian quadrant the closest mesh is in.
        if (closestX > wheel.position.x && closestY <= wheel.position.y) {        // Q1
            snapAngle = angleOfClosestMesh > snapPoint.theta ? snapAngle : -1.0 * snapAngle;
        } 
        else if (closestX <= wheel.position.x && closestY <= wheel.position.y) {  // Q2
            snapAngle = angleOfClosestMesh > snapPoint.theta ? -1.0 * snapAngle : snapAngle;
        } 
        else if (closestX <= wheel.position.x && closestY > wheel.position.y) {   // Q3
            snapAngle = angleOfClosestMesh > snapPoint.theta ? snapAngle : -1.0 * snapAngle;
        } 
        else if (closestX > wheel.position.x && closestY >= wheel.position.y) {   // Q4
            snapAngle = angleOfClosestMesh > snapPoint.theta ? -1.0 * snapAngle : snapAngle;
        }

        return { angle: snapAngle, closestMesh: closestMesh };
    }


    forceHoverCheck() {
        if (this.isConverging) return;

        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        const rayIntersects = this.raycaster.intersectObjects(this.allPhotoMeshes);

        if(!rayIntersects.length) {
            if (this.isHovering) {
                document.body.style.cursor = "default";
                this.isHovering = false;
                this.hoveredItem = null;
            }
        } else {
            document.body.style.cursor = "pointer";
            this.isHovering = true;
            this.hoveredItem = rayIntersects[0].object;
        }
    }


    cleanupEventListeners() {
        document.removeEventListener('wheel', this.handleWheelEvent);
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('pageshow', this.handlePageShow);
        document.removeEventListener('pagehide', this.handlePageHide);  
        this.experience.container.removeEventListener('mousemove', this.handleMouseMove);
        this.experience.container.removeEventListener('click', this.handleMouseClick);
        this.experience.container.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);

        this.disposeResources();

        if (this.experience.container.querySelector('canvas')) {
            const canvas = this.experience.container.querySelector('canvas');
            canvas.removeEventListener('webglcontextlost', this.handleContextLoss);
            canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
        }
    }



    disposeResources() {
        this.texturesToDispose.forEach(texture => {
            if (texture) texture.dispose();
        });
        this.texturesToDispose.length = 0;

        this.materialsToDispose.forEach(material => {
            if (material) material.dispose();
        });
        this.materialsToDispose.length = 0;

        this.allPhotoMeshes.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
        });

        if (this.roundedRectangleGeometry) {
            this.roundedRectangleGeometry.dispose();
        }

        this.allPhotoMeshes.length = 0;
        this.materials.length = 0;
    }



    maintenanceCleanup() {
        // Garbage collection if available
        if (window.gc) window.gc();

        for (let i = 0; i < this.allPhotoMeshes.length; i++) {
            const mesh = this.allPhotoMeshes[i];

            if (mesh.userData.baseRotationZ) {
                // Normalize rotation to prevent accumulation
                mesh.userData.baseRotationZ = mesh.userData.baseRotationZ % (2 * Math.PI);
            }
        }
    }


    setupWebGLContextListeners(rendererInstance) {
        const canvas = rendererInstance.domElement;
        canvas.addEventListener('webglcontextlost', this.handleContextLoss, false);
        canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);
    }



    /* *** Animation helper methods *** */
    startConvergeAnimation(mesh) {
        this.resetAllMeshUserData();

        this.isConverging = true;
        this.convergeProgress = 0;

        let clickedInTopWheel = this.topWheel.children.includes(mesh);
        let topTarget, bottomTarget;

        if (clickedInTopWheel) {
            topTarget = mesh;
            let clickedIndex = this.topWheel.children.indexOf(mesh);
            let totalPhotos = this.topWheel.children.length;
            let oppositeIndex = (clickedIndex + Math.floor(totalPhotos / 2)) % totalPhotos;
            bottomTarget = this.bottomWheel.children[oppositeIndex];
        } else {
            bottomTarget = mesh;
            let clickedIndex = this.bottomWheel.children.indexOf(mesh);
            let totalPhotos = this.bottomWheel.children.length;
            let oppositeIndex = (clickedIndex + Math.floor(totalPhotos / 2)) % totalPhotos;
            topTarget = this.topWheel.children[oppositeIndex];
        }

        this.stopSnapAnimation();

        // Pre-calculate and cache animation data
        for (let i = 0; i < this.allPhotoMeshes.length; i++) {
            const photoMesh = this.allPhotoMeshes[i];

            if (photoMesh === topTarget || photoMesh === bottomTarget) {
                photoMesh.userData.isTarget = true;
                continue;
            }
            
            photoMesh.userData.isTarget = false;
            photoMesh.userData.startPosition = photoMesh.position.clone();

            // Pre-determine target and cache it
            let clickedInTopWheel = this.topWheel.children.includes(photoMesh);
            let target = clickedInTopWheel ? topTarget : bottomTarget;
            photoMesh.userData.cachedTarget = target;
            
            // Pre-calculate animation values
            let startAngle = Math.atan2(photoMesh.position.y, photoMesh.position.x);
            let targetAngle = Math.atan2(target.position.y, target.position.x);
            
            // Choose shortest path around circle
            let angleDiff = targetAngle - startAngle;
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            photoMesh.userData.startAngle = startAngle;
            photoMesh.userData.angleDiff = angleDiff;
            photoMesh.userData.radius = WHEEL_CONFIG.RADIUS;
            photoMesh.userData.startZ = photoMesh.userData.startPosition.z;
            photoMesh.userData.targetZ = target.position.z + ANIMATION_CONFIG.STACK_OFFSET;
            photoMesh.userData.zDiff = photoMesh.userData.targetZ - photoMesh.userData.startZ;
        }

        setTimeout(() => {
            this.cleanupEventListeners();
            window.location.href = mesh.name.projectPath;
        }, ANIMATION_CONFIG.CONVERGE_DURATION);
    }


    endConvergeAnimation() {
        if (!this.isConverging) return;

        this.isConverging = false;
        this.convergeProgress = 0;

        this.resetAllMeshToOriginalState();
    }


    rotateWheels(angle) {
        if (this.isConverging) return;

        this.topWheel.rotateZ(angle);
        this.bottomWheel.rotateZ(angle);
        
        // Counter-rotate each photo mesh to keep them upright
        for (let i = 0; i < this.allPhotoMeshes.length; i++) {
            const mesh = this.allPhotoMeshes[i];
            // Set base rotation if it doesn't exist
            if ( !mesh.userData.baseRotationZ ) {
                mesh.userData.baseRotationZ = 0;
            }

            mesh.rotateZ(-angle);
            mesh.userData.baseRotationZ = mesh.rotation.z;
        }
    }


    startSnapAnimation() {
        if (this.isConverging) return;

        const snapData = this.calculateSnapAngle(this.topWheel);

        if (Math.abs(snapData.angle) < 0.01) return; // Already aligned
        
        this.isSnapping = true;
        this.snapStartRotation = 0;
        this.snapTargetRotation = snapData.angle;
        this.snapProgress = 0;
        this.springVelocity = 0;
        
        // Update project title after snap
        const projectTitle = document.getElementById('project-title');
        if (projectTitle && snapData.closestMesh) {
            projectTitle.textContent = `${snapData.closestMesh.name.projectTitle}`;
        }
    }


    stopSnapAnimation() {
        this.isSnapping = false;
        this.targetVelocity = 0;
        this.currentVelocity = 0;
        clearTimeout(this.spinTimeout);
    }


    stopStepRotation() {
        this.isStepRotating = false;
        this.stepRotationTarget = 0;
        this.stepRotationProgress = 0;
        this.stepRotationVelocity = 0;
    }



    /* *** Animation Loop *** */ 
    tick = () => {
        if (this.isContextLost || document.hidden) return;

        this.updateConvergeAnimation();

        // Snapping and spinning are mutually exclusize
        if (this.isStepRotating || this.isSnapping) {
            this.updateSnapAnimation();
        } else {
            this.updateSpinAnimation();
        }

        this.updateHoverEffects();
        this.updateShaderMaterials();
    }


    /* *** Converge on click Animation *** */
    updateConvergeAnimation() {
        if (this.isConverging) {
            this.convergeProgress += ANIMATION_CONFIG.CONVERGE_SPEED;

            if (this.convergeProgress >= 1) {
                this.convergeProgress = 1;
            }

            // Ease-out
            const eased = 1 - Math.pow(1 - this.convergeProgress, 3);

            for (let  i = 0; i < this.allPhotoMeshes.length; i++) {
                const photoMesh = this.allPhotoMeshes[i];

                // Skip the clicked mesh and its opposite - they stay in place
                if (photoMesh.userData.isTarget) continue;

                // Animate all other meshes
                const currentAngle = photoMesh.userData.startAngle + (photoMesh.userData.angleDiff * eased);
                const newX = Math.cos(currentAngle) * photoMesh.userData.radius;
                const newY = Math.sin(currentAngle) * photoMesh.userData.radius;
                const newZ = photoMesh.userData.startZ + (photoMesh.userData.zDiff * eased);
                
                photoMesh.position.set(newX, newY, newZ);
            }
        }
    }


    /* ***  Snap wheels Animation *** */
    updateSnapAnimation() {
        // Left/Right arrow keys: spring animation to next/prev photo
        if (this.isStepRotating) {
            const displacement = this.stepRotationTarget - this.stepRotationProgress;

            // Spring physics: acceleration proportional to distance from target
            this.stepRotationVelocity += displacement * SCROLL_CONFIG.KEY_STEP_ROTATION_SPEED;
            this.stepRotationVelocity *= SCROLL_CONFIG.KEY_STEP_ROTATION_DAMPING;
            this.stepRotationProgress += this.stepRotationVelocity;

            // When close enough to target, snap exactly and finish
            if ( Math.abs(displacement) < 0.01 && Math.abs(this.stepRotationVelocity) < 0.01 ) {
                const finalRotation  = this.stepRotationTarget - this.stepRotationProgress;
                this.rotateWheels(finalRotation);

                this.stopStepRotation();

                setTimeout(() => {
                    this.startSnapAnimation();
                    setTimeout (() => this.forceHoverCheck(), 50);
                }, 50);
            } else {
                this.rotateWheels(this.stepRotationVelocity);
            }

        }
        // All other snap animations after scroll/swipe/drag
        else if (this.isSnapping) {

            const displacement = this.snapTargetRotation - this.snapProgress;
            
            // Spring-damper system for smooth, natural snapping
            const springForce = displacement * this.springStiffness;
            const dampingForce = this.springVelocity * this.springDamping;

            this.springVelocity += springForce - dampingForce;
            this.snapProgress += this.springVelocity;

            // When close enough, force exact position to prevent drift
            if (Math.abs(displacement) < 0.001 && Math.abs(this.springVelocity) < 0.001) {
                this.snapProgress = this.snapTargetRotation;
                this.springVelocity = 0;
                this.isSnapping = false;
                this.targetVelocity = 0;
                this.currentVelocity = 0;

                setTimeout(() => this.forceHoverCheck(), 0);
            }
            
            // Rotate by the delta since last frame
            const deltaRotation = this.snapProgress - this.snapStartRotation;
            
            this.rotateWheels(deltaRotation);
            this.snapStartRotation = this.snapProgress;
        } 
    }


    /* *** Spin Wheels Animation *** */
    updateSpinAnimation() {
        // Keyboard scrolling holding up/down arrows
        if (this.isKeyPressed) {
            let keyDirection = 0;

            if (this.pressedKeys.has('ArrowUp')) {
                keyDirection += SCROLL_CONFIG.KEY_SPIN_SPEED;
            }
            if (this.pressedKeys.has('ArrowDown')) {
                keyDirection -= SCROLL_CONFIG.KEY_SPIN_SPEED;
            }
            if (keyDirection !== 0) {
                this.targetVelocity = this.clampVelocity(keyDirection);
            }
        }

        this.currentVelocity = MathUtils.lerp(this.currentVelocity, this.targetVelocity, 0.1);
        this.targetVelocity *= ANIMATION_CONFIG.FRICTION;
        
        // Threshold to prevent small movements
        if (Math.abs(this.targetVelocity) < ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
            this.targetVelocity = 0;
        }
        if (Math.abs(this.currentVelocity) < ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
            this.currentVelocity = 0;
        }
        if (this.currentVelocity !== 0) {
            this.rotateWheels(this.currentVelocity);
        }
    }


    /* **** Mouse Hover Animations *** */
    updateHoverEffects() {
        // Throttle the mouse events for performance.
        const now = performance.now();
        if (this.mouseMovedSinceLastCheck && now - this.lastHoverCheck > ANIMATION_CONFIG.HOVER_CHECK_INTERVAL) {
            this.lastHoverCheck = now;
            this.mouseMovedSinceLastCheck = false;

            // Skip raycasting during fast wheel spin
            if (Math.abs(this.currentVelocity) > 0.03) {
                if (this.isHovering) {
                    document.body.style.cursor = "default";
                    this.isHovering = false;
                    this.hoveredItem = null;
                }
                return;
            }

            this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);

            // Only raycast against nearby meshes for performance
            const visibleMeshes = this.allPhotoMeshes.filter(mesh => {
                const distance = this.experience.camera.instance.position.distanceTo(mesh.position);
                return distance < 400; 
            });

            const rayIntersects = this.raycaster.intersectObjects(visibleMeshes);

            // Not hovering
            if (!rayIntersects.length) {
                // Reset just in case
                if (this.isHovering) {
                    document.body.style.cursor = "default";
                    this.isHovering = false;
                    this.hoveredItem = null;
                }
                    
                for (let i = 0; i < this.allPhotoMeshes.length; i++) {
                    const mesh = this.allPhotoMeshes[i];

                    // Reset scale
                    mesh.scale.set(
                        MathUtils.lerp(mesh.scale.x, 1, ANIMATION_CONFIG.LERP_FACTOR), 
                        MathUtils.lerp(mesh.scale.y, 1, ANIMATION_CONFIG.LERP_FACTOR),  
                        MathUtils.lerp(mesh.scale.z, 1, ANIMATION_CONFIG.LERP_FACTOR)
                    );

                    // Reset x and y tilt rotation
                    mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, 0, ANIMATION_CONFIG.LERP_FACTOR);
                    mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, 0, ANIMATION_CONFIG.LERP_FACTOR);

                    // Reset z rotation
                    const targetRotationZ = mesh.userData.baseRotationZ || 0;
                    const rotationDiff = targetRotationZ - mesh.rotation.z;

                    // Handle angle wrapping -π to π 
                    if (Math.abs(rotationDiff) > Math.PI) {
                        mesh.rotation.z = targetRotationZ;
                    } else {
                        mesh.rotation.z = MathUtils.lerp(
                            mesh.rotation.z, 
                            targetRotationZ, 
                            ANIMATION_CONFIG.LERP_FACTOR
                        );
                    }

                    // Reset rim lighting
                    if (mesh.material.uniforms && mesh.material.uniforms.uMouseInfluence) {
                        mesh.material.uniforms.uMouseInfluence.value = MathUtils.lerp(
                            mesh.material.uniforms.uMouseInfluence.value, 
                            0.0, 
                            ANIMATION_CONFIG.LERP_FACTOR
                        );
                    }
                }
            }


            // Apply effects to hovered item
            else { 
                document.body.style.cursor = "pointer";
                this.isHovering = true;
                this.hoveredItem = rayIntersects[0].object;

                for (let i = 0; i < this.allPhotoMeshes.length; i++) {
                    const mesh = this.allPhotoMeshes[i];

                    // Reset non hovered items
                    if (mesh != this.hoveredItem) {
                        mesh.scale.set(
                            MathUtils.lerp(mesh.scale.x, 1, ANIMATION_CONFIG.LERP_FACTOR), 
                            MathUtils.lerp(mesh.scale.y, 1, ANIMATION_CONFIG.LERP_FACTOR),  
                            MathUtils.lerp(mesh.scale.z, 1, ANIMATION_CONFIG.LERP_FACTOR)
                        );

                        if (mesh.material.uniforms && mesh.material.uniforms.uMouseInfluence) {
                            mesh.material.uniforms.uMouseInfluence.value = MathUtils.lerp(
                                mesh.material.uniforms.uMouseInfluence.value, 
                                0.0, 
                                ANIMATION_CONFIG.LERP_FACTOR
                            );
                        }
                    }

                    // Reset X and Y rotation for all meshes
                    mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, 0, ANIMATION_CONFIG.LERP_FACTOR);
                    mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, 0, ANIMATION_CONFIG.LERP_FACTOR);

                    // Restore base Z rotation
                    const targetRotationZ = mesh.userData.baseRotationZ || 0;
                    const rotationDiff = targetRotationZ - mesh.rotation.z;
                    
                    if (Math.abs(rotationDiff) > Math.PI) {
                        mesh.rotation.z = targetRotationZ;
                    } else {
                        mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, targetRotationZ, ANIMATION_CONFIG.LERP_FACTOR);
                    }
                }
                
                // Scale up the hovered item
                this.hoveredItem.scale.set(
                    MathUtils.lerp(this.hoveredItem.scale.x, INTERACTION_CONFIG.HOVER_SCALE, ANIMATION_CONFIG.LERP_FACTOR * 1.25), 
                    MathUtils.lerp(this.hoveredItem.scale.y, INTERACTION_CONFIG.HOVER_SCALE, ANIMATION_CONFIG.LERP_FACTOR * 1.25),  
                    MathUtils.lerp(this.hoveredItem.scale.z, INTERACTION_CONFIG.HOVER_SCALE, ANIMATION_CONFIG.LERP_FACTOR * 1.25)
                );

                
                // Tilt effect animation
                this.hoveredItem.getWorldPosition(this.tiltVector);
                this.tiltVector.project(this.experience.camera.instance);

                const screenX = this.tiltVector.x;
                const screenY = this.tiltVector.y;

                // Calculate mouse offset from photo center
                const offsetX = this.mouse.x - screenX;
                const offsetY = this.mouse.y - screenY;

                // Normalize and clamp offset
                const normalizedX = MathUtils.clamp(offsetX / INTERACTION_CONFIG.PHOTO_SCREEN_SIZE, -1, 1);
                const normalizedY = MathUtils.clamp(offsetY / INTERACTION_CONFIG.PHOTO_SCREEN_SIZE, -1, 1);

                // Convert to tilt angles
                const tiltX = normalizedY * INTERACTION_CONFIG.MAX_TILT;
                const tiltY = normalizedX * INTERACTION_CONFIG.MAX_TILT;

                this.hoveredItem.rotation.x = MathUtils.lerp(this.hoveredItem.rotation.x, tiltX, ANIMATION_CONFIG.LERP_FACTOR);
                this.hoveredItem.rotation.y = MathUtils.lerp(this.hoveredItem.rotation.y, tiltY, ANIMATION_CONFIG.LERP_FACTOR);

                // Rim lighting for hovered item
                if (this.hoveredItem.material.uniforms) {
                    const mouseScreenX = (this.mouse.x + 1) * 0.5;
                    const mouseScreenY = (this.mouse.y + 1) * 0.5;
                    
                    this.hoveredItem.material.uniforms.uMousePosition.value.set(mouseScreenX, mouseScreenY);
                    this.hoveredItem.material.uniforms.uMouseInfluence.value = MathUtils.lerp(
                        this.hoveredItem.material.uniforms.uMouseInfluence.value, 
                        1.0, 
                        ANIMATION_CONFIG.LERP_FACTOR
                    );
                }

                // Maintain base Z rotation (no additional tilting on Z-axis)
                const targetZ = this.hoveredItem.userData.baseRotationZ || 0;
                const zDiff = targetZ - this.hoveredItem.rotation.z;
                
                if (Math.abs(zDiff) > Math.PI) {
                    this.hoveredItem.rotation.z = targetZ;
                } else if (Math.abs(zDiff) > 0.05) { 
                    // Slower correction to avoid fighting with tilt animations
                    this.hoveredItem.rotation.z = MathUtils.lerp(
                        this.hoveredItem.rotation.z, 
                        targetZ, 
                        ANIMATION_CONFIG.LERP_FACTOR * 0.5
                    );
                }
            }
        }
    }

    updateShaderMaterials() {
        const visibleMaterials = this.materials.filter((_, i) => 
            this.allPhotoMeshes[i].visible
        );

        for (let i = 0; i < visibleMaterials.length; i++) {
            if (visibleMaterials[i].updateLights) {
                visibleMaterials[i].updateLights(this.experience.lights.group);
            }
        }

        for (let  i = 0; i < this.allPhotoMeshes.length; i++) {
            const mesh = this.allPhotoMeshes[i];

            const distanceToCamera = this.experience.camera.instance.position.distanceTo(mesh.position);
            if (distanceToCamera > 200) {
                // Lower quality for distant objects
                mesh.material.uniforms.uLOD.value = 0.5; 
            } else {
                mesh.material.uniforms.uLOD.value = 1.0;
            }
        }
    }
}