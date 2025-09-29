import { createTexture } from './PhotoWheel/texture.js'
import { createMaterial } from './PhotoWheel/material.js';
import { createGeometry } from './PhotoWheel/geometry.js';
import { createMesh } from './PhotoWheel/mesh.js';
import {
    WHEEL_CONFIG,
    GEOMETRY_CONFIG,
    ANIMATION_CONFIG,
    INTERACTION_CONFIG,
    SCROLL_CONFIG,
    PHOTOS_DATA,
} from './config.js';
import {
    Group,
    MathUtils,
    Raycaster,
    TextureLoader,
    Vector2,
    Vector3,
} from 'three';

function createWheels (camera, container, lights) {
    /**
    * Create geometry, texture, materials, meshes, and photo wheel groups
    */
   const textureLoader = new TextureLoader();
   const materials = [];
   const texturesToDispose = [];
   const materialsToDispose = [];
   const allPhotoMeshes = [];
   const topWheel = new Group();
   const bottomWheel = new Group();
   const roundedRectangleGeometry = createGeometry(
       GEOMETRY_CONFIG.SIZE,
       GEOMETRY_CONFIG.SIZE,
       GEOMETRY_CONFIG.CORNER_RADIUS,
       GEOMETRY_CONFIG.CORNER_SMOOTHNESS
   );
    
    for (let i = 0; i < PHOTOS_DATA.length; i++) {
        const texture = createTexture(textureLoader, PHOTOS_DATA[i].imagePath);
        texturesToDispose.push(texture);

        const material = createMaterial(texture, lights);
        materials.push(material);
        materialsToDispose.push(material);

        const photoMeshTop = createMesh(roundedRectangleGeometry, materials[i], PHOTOS_DATA[i], i);
        const photoMeshBottom = createMesh(roundedRectangleGeometry, materials[i], PHOTOS_DATA[i], i);

        allPhotoMeshes.push(photoMeshTop, photoMeshBottom);
        topWheel.add(photoMeshTop);
        bottomWheel.add(photoMeshBottom);
    }
    topWheel.translateY(WHEEL_CONFIG.POSITION + WHEEL_CONFIG.POSITION_OFFSET);
    bottomWheel.translateY(-WHEEL_CONFIG.POSITION + WHEEL_CONFIG.POSITION_OFFSET);



    /**
    * Events and Listener logic
    */

    /* Scroll/Wheel Event */
    let targetVelocity = 0;
    let currentVelocity = 0;
    let spinTimeout = null;

    /* Touch/Swipe Event */
    let xDown = null;                                                        
    let yDown = null;

    /* Mouse Event */
    const mouse = new Vector2();
    let mouseMovedSinceLastCheck = false;
    let lastHoverCheck = 0;
    let lastMouseMoveTime = 0;
    const tiltVector = new Vector3();

    /* Drag Event */
    let isDragging = false;
    let dragDidMove = false;
    let dragStartPosition = new Vector2();
    let dragCurrentPosition = new Vector2();
    let dragStartAngle = 0;
    let lastDragAngle = 0;
    let dragVelocityHistory = [];
    let lastDragTime = 0;

    /* Click Event */
    let isHovering = false;
    let hoveredItem = null;
    const raycaster = new Raycaster();

    /* Key Press Event */
    let isKeyPressed = false;
    let pressedKeys = new Set();
    let keyVelocity = 0;
    let isStepRotating = false;
    let stepRotationTarget = 0;
    let stepRotationProgress = 0;
    let stepRotationVelocity = 0;

    /* Context lost / visibility */
    let isContextLost = false;
    
    /* Snapping + Springing animation state */
    let isSnapping = false;
    let snapStartRotation = 0;
    let snapTargetRotation = 0;
    let snapProgress = 0;
    let springVelocity = 0;
    let springDamping = ANIMATION_CONFIG.INITIAL_SPRING_DAMPING;
    let springStiffness = ANIMATION_CONFIG.INITIAL_SPRING_STIFFNESS;
    const tempVector = new Vector3();
    const snapPoint = { x: 0, y: 0, theta: 0 };

    /* Converge Animation State */
    let isConverging = false;
    let convergeProgress = 0;
    let clickedMesh = null;



    document.addEventListener('wheel', handleWheelEvent);
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove);     
    document.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleMouseClick);
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('pageshow', handlePageShow);
    document.addEventListener('pagehide', handlePageHide);
    
    

    function handleWheelEvent(event) {
        if (isConverging)  {
            endConvergeAnimation();
            return;
        }

        isSnapping = false
        clearTimeout(spinTimeout);

        if (isHovering) {
            for (let i = 0, len = allPhotoMeshes.length; i < len; i++) {
                allPhotoMeshes[i].scale.set(1, 1, 1);
            }
        }

        const scroll = event.deltaY;
        const scrollIntensity = Math.abs(scroll) / SCROLL_CONFIG.INTENSITY_DIVISOR;
        let velocityChange = Math.min(
            scrollIntensity * SCROLL_CONFIG.BASE_VELOCITY_CHANGE, 
            SCROLL_CONFIG.MAX_VELOCITY_CHANGE
        );

        if (Math.abs(scroll) < SCROLL_CONFIG.TRACKPAD_THRESHOLD) {
            // Trackpad
            velocityChange *= SCROLL_CONFIG.TRACKPAD_MULTIPLIER;

            clearTimeout(spinTimeout);
            spinTimeout = setTimeout(() => {
                startSnapAnimation()
                setTimeout(() => forceHoverCheck(), SCROLL_CONFIG.TRACKPAD_THRESHOLD);
            }, SCROLL_CONFIG.TRACKPAD_SNAP_DELAY);
        } else {
            // Mouse wheel
            clearTimeout(spinTimeout);

            spinTimeout = setTimeout(() => {
                startSnapAnimation()
                setTimeout(() => forceHoverCheck(), 50);
            }, SCROLL_CONFIG.MOUSE_WHEEL_SNAP_DELAY);
        }

        if (scroll > 0) {
            targetVelocity -= velocityChange;
        } else {
            targetVelocity += velocityChange;
        }

        // Clamp velocity [-MAX_VELOCITY, MAX_VELOCITY]
        targetVelocity = Math.max(-ANIMATION_CONFIG.MAX_VELOCITY, Math.min(ANIMATION_CONFIG.MAX_VELOCITY, targetVelocity));
    }



    function handleTouchStart(event) {
        const firstTouch = event.touches[0];                                      
        xDown = firstTouch.clientX;                                      
        yDown = firstTouch.clientY; 
        
        if(isConverging) {
            endConvergeAnimation();
            return;
        }
        
        stopSnapAnimation();
    }



    function handleTouchMove(event) {
        if (!xDown || !yDown) { return; }

        let xUp = event.touches[0].clientX;                                    
        let yUp = event.touches[0].clientY;
        let xDiff = xDown - xUp;
        let yDiff = yDown - yUp;

        let swipeSpeed = Math.sqrt(( Math.pow(xDiff, 2) + Math.pow(yDiff, 2) )) / SCROLL_CONFIG.SWIPE_DIVISOR;
        swipeSpeed = Math.min(swipeSpeed, SCROLL_CONFIG.MAX_SWIPE_SPEED);

        // Determine swipe direction
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            targetVelocity = xDiff > 0 ? -swipeSpeed : swipeSpeed;
        } else {
            targetVelocity = yDiff > 0 ? swipeSpeed : -swipeSpeed;
        }                                                               

        targetVelocity = Math.max(-ANIMATION_CONFIG.MAX_VELOCITY, Math.min(ANIMATION_CONFIG.MAX_VELOCITY, targetVelocity));

        // Reset the swipeSpeed calculation so the wheels don't accelerate
        xDown = xUp;
        yDown = yUp;

        clearTimeout(spinTimeout);
        spinTimeout = setTimeout(startSnapAnimation, SCROLL_CONFIG.SWIPE_SNAP_DELAY);
    }


    
    function handleTouchEnd() {
        xDown = null;
        yDown = null;
    }



    function handleMouseMove(event) {
        const now = performance.now();
        if (now - lastMouseMoveTime < 16) return;
        lastMouseMoveTime = now;

        // Normalize mouse coordinates
        mouse.x = event.clientX / window.innerWidth * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight * 2 - 1);
        mouseMovedSinceLastCheck = true;
        
        if (isDragging) {
            handleMouseDrag(event);
        }
    }



    function handleMouseDown(event) {

        if (isConverging) {
            endConvergeAnimation();
            return;
        }

        isDragging = true;
        dragDidMove = false;
        dragStartPosition.x = event.clientX;
        dragStartPosition.y = event.clientY;
        dragCurrentPosition.x = event.clientX;
        dragCurrentPosition.y = event.clientY;

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        dragStartAngle = Math.atan2(
            dragStartPosition.y - centerY,
            dragStartPosition.x - centerX
        );
        lastDragAngle = dragStartAngle;

        dragVelocityHistory.length = 0;
        lastDragTime = performance.now();

        stopSnapAnimation();
        stopStepRotation();

        document.body.style.cursor = "grabbing";

        event.preventDefault();
    }



    function handleMouseDrag(event) {
        if (!isDragging) return;

        const now = performance.now()
        const deltaTime = now - lastDragTime;

        dragCurrentPosition.x = event.clientX;
        dragCurrentPosition.y = event.clientY;

        const deltaX = dragCurrentPosition.x - dragStartPosition.x;
        const sensitivity = 4000;
        let angleDiff = (deltaX / sensitivity) * Math.PI * 2;
        
        // Handle angle wrapping around -π to π
        dragStartPosition.x = dragCurrentPosition.x;
        dragStartPosition.y = dragCurrentPosition.y;

        if (Math.abs(angleDiff) > 0.001) {
            dragDidMove = true;
            const maxDragSpeed = 0.075;
            angleDiff = Math.max(-maxDragSpeed, Math.min(maxDragSpeed, angleDiff));

            rotateWheels(angleDiff);

            if (deltaTime > 0) {
                const angularVelocity  = angleDiff / (deltaTime * 1000);
                dragVelocityHistory.push({
                    velocity: angularVelocity,
                    time: now,
                });

                if (dragVelocityHistory.length > INTERACTION_CONFIG.VELOCITY_HISTORY_LENGTH) {
                    dragVelocityHistory.shift();
                }
            }
        }

        lastDragTime = now;

        event.preventDefault();
    }



    function handleMouseUp(event) {
        if (!isDragging) return;

        isDragging = false;
        document.body.style.cursor = 'default';

        const now = performance.now();
        let releaseVelocity = 0;

        if (dragVelocityHistory.length > 0) {
            const recentSamples = dragVelocityHistory.filter((sum, sample) => {
                now - sample.time < 100;
            });

            if (recentSamples.length > 0) {
                const avgVelocity = recentSamples.reduce((sum, sample) => 
                    sum + sample.velocity, 0
                ) / recentSamples.length;

                releaseVelocity = avgVelocity;
            }

            releaseVelocity = Math.max(
                -ANIMATION_CONFIG.MAX_VELOCITY, 
                Math.min(ANIMATION_CONFIG.MAX_VELOCITY, releaseVelocity)
            );
        }

        // Apply momentum if there's significant velocity
        if (Math.abs(releaseVelocity) > 0.005) {
            targetVelocity = releaseVelocity;
            
            clearTimeout(spinTimeout);
            spinTimeout = setTimeout(() => {
                startSnapAnimation();
                setTimeout(() => forceHoverCheck(), 50);
            }, 800); 
        } else {
            setTimeout(() => {
                startSnapAnimation();
                setTimeout(() => forceHoverCheck(), 50);
            }, 100);
        }
        
        // Clear velocity history
        dragVelocityHistory.length = 0;
        
        event.preventDefault();
    }



    function handleMouseClick() {
        if (dragDidMove) {
            dragDidMove = false;
            return;
        }

        if (isHovering && Math.abs(currentVelocity) < INTERACTION_CONFIG.VELOCITY_CLICK_THRESHOLD) {
            // Clicked while snapping, wait a moment
            if (isSnapping) {
                setTimeout(() => {
                    if (isHovering) {
                        executeClick()
                    }
                }, 100);
            } else {
                executeClick();
            }
        } 
    }



    function executeClick() {
        if (!isConverging) {
            startConvergeAnimation(hoveredItem);
        } else {
            window.location.href = hoveredItem.name.projectPath;
        }
    }



    function handleKeyDown(event) {
        // Only care about arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(event.code)) {
            event.preventDefault();
        } else {
            return;
        }

        if (event.code == 'Enter') {
            handleEnterKey();
            return;
        }

        if (isConverging) {
            endConvergeAnimation();
            return;
        }

        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            if (!pressedKeys.has(event.code)) {
                pressedKeys.add(event.code);
                isKeyPressed = true;
                
                stopSnapAnimation();
                stopStepRotation();
                
                if (isHovering) {
                    for (let i = 0, len = allPhotoMeshes.length; i < len; i++) {
                        allPhotoMeshes[i].scale.set(1, 1, 1);
                    }
                }
            }
        }

        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            if (!pressedKeys.has(event.code)) {
                pressedKeys.add(event.code);
                
                stopSnapAnimation();
                
                isStepRotating = true;
                stepRotationProgress = 0;
                stepRotationVelocity = 0;
                
                // Calculate rotation amount: one radian interval plus extra for spring effect
                const baseRotation = WHEEL_CONFIG.RADIAN_INTERVAL;
                const totalRotation = baseRotation + SCROLL_CONFIG.KEY_STEP_ROTATION_EXTRA;
                
                if (event.code === 'ArrowLeft') {
                    stepRotationTarget = totalRotation;
                } else {
                    stepRotationTarget = -totalRotation;
                }
                
            }
        }
    }



    function handleEnterKey() {
        if ( isConverging || isSnapping || isStepRotating || isKeyPressed ) {
            return;
        }

        if (Math.abs(currentVelocity) > ANIMATION_CONFIG.VELOCITY_THRESHOLD ||
            Math.abs(targetVelocity) > ANIMATION_CONFIG.VELOCITY_THRESHOLD ) {
            return;
        }

        const snapData = calculateSnapAngle(topWheel);

        if ( !snapData.closestMesh || Math.abs(snapData.angle) > 0.05) {
            return;
        }

        startConvergeAnimation(snapData.closestMesh);
    }



    function handleKeyUp(event) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
            event.preventDefault();
        }

        if (event.code === 'Enter') {
            return;
        }

        pressedKeys.delete(event.code);

        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            if (!pressedKeys.has('ArrowUp') && !pressedKeys.has('ArrowDown')) {
                isKeyPressed = false;
                keyVelocity = 0;
                
                // Start snap animation similar to scroll/swipe end
                setTimeout(() => {
                    startSnapAnimation();
                    setTimeout(() => forceHoverCheck(), 50);
                }, 100);
            }
        }
    }



    function stopStepRotation() {
        isStepRotating = false;
        stepRotationTarget = 0;
        stepRotationProgress = 0;
        stepRotationVelocity = 0;
    }



    function handleVisibilityChange() {
        if (document.hidden && isConverging) {
            endConvergeAnimation();
        }
    }



    function handlePageShow(event) {
        if (event.persisted) {
            endConvergeAnimation();

            isSnapping = false;
            targetVelocity = 0;
            currentVelocity = 0;
            convergeProgress = 0;

            for (let i = 0; i < allPhotoMeshes.length; i++) {
                resetMeshToOriginalState(allPhotoMeshes[i]);
            }
        }
    }



    function handlePageHide() {
        if (isConverging) {
            endConvergeAnimation();
        }
        clearTimeout(spinTimeout);

        // Dispose resources when page is hidden for 30s
        setTimeout(() => {
            if (document.hidden) {
                console.log('Page hidden - disposing resources');
                disposeResources();
            }
        }, 30000);
    }



    function handleContextLoss(event) {
        event.preventDefault();
        isContextLost = true;
        console.warn('WebGL context lost - pausing animations');

        if (isConverging) {
            endConvergeAnimation();
        }

        stopSnapAnimation();
    }



    function handleContextRestored() {
        isContextLost = false;
    }



    function startConvergeAnimation(mesh) {
        resetAllMeshUserData();

        isConverging = true;
        convergeProgress = 0;
        clickedMesh = mesh;

        let clickedInTopWheel = topWheel.children.includes(mesh);
        let topTarget, bottomTarget;

        if (clickedInTopWheel) {
            topTarget = mesh;
            let clickedIndex = topWheel.children.indexOf(mesh);
            let totalPhotos = topWheel.children.length;
            let oppositeIndex = (clickedIndex + Math.floor(totalPhotos / 2)) % totalPhotos;
            bottomTarget = bottomWheel.children[oppositeIndex];
        } else {
            bottomTarget = mesh;
            let clickedIndex = bottomWheel.children.indexOf(mesh);
            let totalPhotos = bottomWheel.children.length;
            let oppositeIndex = (clickedIndex + Math.floor(totalPhotos / 2)) % totalPhotos;
            topTarget = topWheel.children[oppositeIndex];
        }

        stopSnapAnimation();

        // Pre-calculate and cache animation data
        for (let i = 0; i < allPhotoMeshes.length; i++) {
            const photoMesh = allPhotoMeshes[i];

            if (photoMesh === topTarget || photoMesh === bottomTarget) {
                photoMesh.userData.isTarget = true;
                continue;
            }
            
            photoMesh.userData.isTarget = false;
            photoMesh.userData.startPosition = photoMesh.position.clone();

            // Pre-determine target and cache it
            let clickedInTopWheel = topWheel.children.includes(photoMesh);
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
            cleanupEventListeners();
            window.location.href = mesh.name.projectPath;
        }, ANIMATION_CONFIG.CONVERGE_DURATION);
    }



    function endConvergeAnimation() {
        if (!isConverging) return;

        isConverging = false;
        convergeProgress = 0;
        clickedMesh = null;

        for (let i = 0; i < allPhotoMeshes.length; i++) {
            resetMeshToOriginalState(allPhotoMeshes[i]);
        }
    }



    function rotateWheels(angle) {
        if (isConverging) return;

        topWheel.rotateZ(angle);
        bottomWheel.rotateZ(angle);
        
        for (let i = 0, len = allPhotoMeshes.length; i < len; i++) {
            const mesh = allPhotoMeshes[i];
            // Set base rotation if it doesn't exist
            if ( !mesh.userData.baseRotationZ ) {
                mesh.userData.baseRotationZ = 0;
            }

            // Update both the actual rotation and the base rotation together
            mesh.rotateZ(-angle);
            mesh.userData.baseRotationZ = mesh.rotation.z;
        }
    }



    function startSnapAnimation() {
        if (isConverging) return;

        const snapData = calculateSnapAngle(topWheel);

        if (Math.abs(snapData.angle) < 0.01) return; // Already aligned
        
        isSnapping = true;
        snapStartRotation = 0;
        snapTargetRotation = snapData.angle;
        snapProgress = 0;
        springVelocity = 0;
        
        // Update project title after snap
        const projectTitle = document.getElementById('project-title');
        if (projectTitle && snapData.closestMesh) {
            projectTitle.textContent = `${snapData.closestMesh.name.projectTitle}`;
        }
    }



    function stopSnapAnimation() {
        isSnapping = false;
        targetVelocity = 0;
        currentVelocity = 0;
        clearTimeout(spinTimeout);
    }



    function calculateSnapAngle (wheel) {
        snapPoint.x = wheel.children[4].position.x;
        snapPoint.y = wheel.children[4].position.y;
        snapPoint.theta = Math.atan2(
            Math.abs(snapPoint.y - wheel.position.y), 
            Math.abs(snapPoint.x - wheel.position.x)
        );
        
        let closestMesh = null;
        let closestX = 0.0;
        let closestY = 0.0;
        let shortestDistance = Infinity

        // Determine mesh with the shortest square distance to snap point 
        for (let i = 0, len = topWheel.children.length; i < len; i++) {
            const element = topWheel.children[i];
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

        // Determines whether the wheels need to be rotated cw or ccw based on the cartesian quadrant it is in.
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



    function forceHoverCheck() {
        if (isConverging) return;

        raycaster.setFromCamera(mouse, camera);
        const rayIntersects = raycaster.intersectObjects(allPhotoMeshes);

        if(!rayIntersects.length) {
            if (isHovering) {
                document.body.style.cursor = "default";
                isHovering = false;
                hoveredItem = null;
            }
        } else {
            document.body.style.cursor = "pointer";
            isHovering = true;
            hoveredItem = rayIntersects[0].object;
        }
    }



    function resetMeshUserData(mesh) {
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



    function resetAllMeshUserData() {
        for (let i = 0; i < allPhotoMeshes.length; i++) {
            resetMeshUserData(allPhotoMeshes[i]);
        }
    }



    function resetMeshToOriginalState(mesh) {
        if (mesh.userData.originalPosition) {
            mesh.position.copy(mesh.userData.originalPosition);
        }
        
        mesh.scale.set(1, 1, 1);
        mesh.rotation.x = 0;
        mesh.rotation.y = 0;
        mesh.rotation.z = mesh.userData.baseRotationZ || 0;
        
        resetMeshUserData(mesh);
    }



    function cleanupEventListeners() {
        document.removeEventListener('wheel', handleWheelEvent);
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('pageshow', handlePageShow);
        document.removeEventListener('pagehide', handlePageHide);  
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('click', handleMouseClick);
        container.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);

        disposeResources();

        if (container.querySelector('canvas')) {
            const canvas = container.querySelector('canvas');
            canvas.removeEventListener('webglcontextlost', handleContextLoss);
            canvas.removeEventListener('webglcontextrestored', handleContextRestored);
        }
    }



    function disposeResources() {
        texturesToDispose.forEach(texture => {
            if (texture) texture.dispose();
        });
        texturesToDispose.length = 0;

        materialsToDispose.forEach(material => {
            if (material) material.dispose();
        });
        materialsToDispose.length = 0;

        allPhotoMeshes.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
        });

        if (roundedRectangleGeometry) {
            roundedRectangleGeometry.dispose();
        }

        allPhotoMeshes.length = 0;
        materials.length = 0;
    }



    function maintenanceCleanup() {
        // Garbage collection if available
        if (window.gc) window.gc();

        for (let i = 0; i < allPhotoMeshes.length; i++) {
            const mesh = allPhotoMeshes[i];

            if (mesh.userData.baseRotationZ) {
                // Normalize rotation to prevent accumulation
                mesh.userData.baseRotationZ = mesh.userData.baseRotationZ % (2 * Math.PI);
            }
        }
    }


    function setupWebGLListeners(rendererInstance) {
        const canvas = rendererInstance.domElement;
        canvas.addEventListener('webglcontextlost', handleContextLoss, false);
        canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
    }



    /**
    * Animation Loop   
    */
    const photoWheels = new Group();
    photoWheels.add(topWheel, bottomWheel);
    photoWheels.cleanup = cleanupEventListeners;
    photoWheels.setupWebGL = setupWebGLListeners;
    photoWheels.disposeResources = disposeResources;


    photoWheels.tick = () => {
        if (isContextLost || document.hidden) return;

        const now = performance.now();

        // Converge on click animation
        if (isConverging) {
            convergeProgress += ANIMATION_CONFIG.CONVERGE_SPEED;

            if (convergeProgress >= 1) {
                convergeProgress = 1;
            }

            const eased = 1 - Math.pow(1 - convergeProgress, 3);

            // Animate all photo meshes but the clicked one
            for (let  i = 0; i < allPhotoMeshes.length; i++) {
                const photoMesh = allPhotoMeshes[i];

                if (photoMesh.userData.isTarget) continue;

                const currentAngle = photoMesh.userData.startAngle + (photoMesh.userData.angleDiff * eased);
                const newX = Math.cos(currentAngle) * photoMesh.userData.radius;
                const newY = Math.sin(currentAngle) * photoMesh.userData.radius;
                const newZ = photoMesh.userData.startZ + (photoMesh.userData.zDiff * eased);
                
                photoMesh.position.set(newX, newY, newZ);
            }
        }


        //  Snap wheels Animation
        else {
            if (isStepRotating) {
                const displacement = stepRotationTarget - stepRotationProgress;

                stepRotationVelocity += displacement * SCROLL_CONFIG.KEY_STEP_ROTATION_SPEED;
                stepRotationVelocity *= SCROLL_CONFIG.KEY_STEP_ROTATION_DAMPING;
                stepRotationProgress += stepRotationVelocity;

                if ( Math.abs(displacement) < 0.01 && Math.abs(stepRotationVelocity) < 0.01 ) {
                    const finalRotation  = stepRotationTarget - stepRotationProgress;
                    rotateWheels(finalRotation);

                    stopStepRotation();

                    setTimeout(() => {
                        startSnapAnimation();
                        setTimeout (() => forceHoverCheck(), 50);
                    }, 50);
                } else {
                    const deltaRotation = stepRotationVelocity;
                    rotateWheels(deltaRotation);
                }

            }
            else if (isSnapping) {

                const displacement = snapTargetRotation - snapProgress;
                const springForce = displacement * springStiffness;
                const dampingForce = springVelocity * springDamping;

                springVelocity += springForce - dampingForce;
                snapProgress += springVelocity;

                // If really small spring and really small velocity
                if (Math.abs(displacement) < 0.001 && Math.abs(springVelocity) < 0.001) {
                    snapProgress = snapTargetRotation;
                    springVelocity = 0;
                    isSnapping = false;
                    targetVelocity = 0;
                    currentVelocity = 0;

                    setTimeout(() => forceHoverCheck(), 0);
                }
                
                const deltaRotation = snapProgress - snapStartRotation;
                
                rotateWheels(deltaRotation);
                snapStartRotation = snapProgress;
            } 


            // Scroll wheels Animation
            else { 

                // Keyboard scrolling
                if (isKeyPressed) {
                    let keyDirection = 0;

                    if (pressedKeys.has('ArrowUp')) {
                        keyDirection += SCROLL_CONFIG.KEY_SPIN_SPEED;
                    }
                    if (pressedKeys.has('ArrowDown')) {
                        keyDirection -= SCROLL_CONFIG.KEY_SPIN_SPEED;
                    }
                    
                    if (keyDirection !== 0) {
                        targetVelocity = keyDirection;
                        // Clamp to max velocity
                        targetVelocity = Math.max(-ANIMATION_CONFIG.MAX_VELOCITY, Math.min(ANIMATION_CONFIG.MAX_VELOCITY, targetVelocity));
                    }
                }

                currentVelocity = MathUtils.lerp(currentVelocity, targetVelocity, 0.1);
                targetVelocity *= ANIMATION_CONFIG.FRICTION;
                
                // Stop very small movements
                if (Math.abs(targetVelocity) < ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
                    targetVelocity = 0;
                }
                if (Math.abs(currentVelocity) < ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
                    currentVelocity = 0;
                }
                
                if (currentVelocity !== 0) {
                    rotateWheels(currentVelocity);
                }
            }
        }
 

        // Hover effects animation
        if (mouseMovedSinceLastCheck && now - lastHoverCheck > ANIMATION_CONFIG.HOVER_CHECK_INTERVAL) {
            lastHoverCheck = now;
            mouseMovedSinceLastCheck = false;

            // Skip raycasting during fast movement
            if (Math.abs(currentVelocity) > 0.03) {
                if (isHovering) {
                    document.body.style.cursor = "default";
                    isHovering = false;
                    hoveredItem = null;
                }
                return;
            }

            raycaster.setFromCamera(mouse, camera);

            const visibleMeshes = allPhotoMeshes.filter(mesh => {
                const distance = camera.position.distanceTo(mesh.position);
                return distance < 400; 
            });

            const rayIntersects = raycaster.intersectObjects(visibleMeshes);

            // Not hovering
            if (!rayIntersects.length) {
                if (isHovering) {
                    document.body.style.cursor = "default";
                    isHovering = false;
                    hoveredItem = null;
                }
                    
                for (let i = 0, len = allPhotoMeshes.length; i < len; i++) {
                    const mesh = allPhotoMeshes[i];

                    mesh.scale.set(
                        MathUtils.lerp(mesh.scale.x, 1, ANIMATION_CONFIG.LERP_FACTOR), 
                        MathUtils.lerp(mesh.scale.y, 1, ANIMATION_CONFIG.LERP_FACTOR),  
                        MathUtils.lerp(mesh.scale.z, 1, ANIMATION_CONFIG.LERP_FACTOR)
                    );

                    mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, 0, ANIMATION_CONFIG.LERP_FACTOR);
                    mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, 0, ANIMATION_CONFIG.LERP_FACTOR);

                    const targetRotationZ = mesh.userData.baseRotationZ || 0;
                    const rotationDiff = targetRotationZ - mesh.rotation.z;

                    if (Math.abs(rotationDiff) > Math.PI) {
                        mesh.rotation.z = targetRotationZ;
                    } else {
                        mesh.rotation.z = MathUtils.lerp(
                            mesh.rotation.z, 
                            targetRotationZ, 
                            ANIMATION_CONFIG.LERP_FACTOR
                        );
                    }

                    if (mesh.material.uniforms && mesh.material.uniforms.uMouseInfluence) {
                        mesh.material.uniforms.uMouseInfluence.value = MathUtils.lerp(
                            mesh.material.uniforms.uMouseInfluence.value, 
                            0.0, 
                            ANIMATION_CONFIG.LERP_FACTOR
                        );
                    }
                }
            }


            // Hovering 
            else { 
                document.body.style.cursor = "pointer";
                isHovering = true;
                hoveredItem = rayIntersects[0].object;

                for (let i = 0; i < allPhotoMeshes.length; i++) {
                    const mesh = allPhotoMeshes[i];

                    // Reset non hovered items
                    if (mesh != hoveredItem) {
                        mesh.scale.set(
                            MathUtils.lerp(mesh.scale.x, 1, ANIMATION_CONFIG.LERP_FACTOR), 
                            MathUtils.lerp(mesh.scale.y, 1, ANIMATION_CONFIG.LERP_FACTOR),  
                            MathUtils.lerp(mesh.scale.z, 1, ANIMATION_CONFIG.LERP_FACTOR)
                        );

                        // Reset rim lighting for non-hovered items
                        if (mesh.material.uniforms && mesh.material.uniforms.uMouseInfluence) {
                            mesh.material.uniforms.uMouseInfluence.value = MathUtils.lerp(
                                mesh.material.uniforms.uMouseInfluence.value, 
                                0.0, 
                                ANIMATION_CONFIG.LERP_FACTOR
                            );
                        }
                    }

                    mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, 0, ANIMATION_CONFIG.LERP_FACTOR);
                    mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, 0, ANIMATION_CONFIG.LERP_FACTOR);

                    // Handle Z rotation carefully for non-hovered items
                    const targetRotationZ = mesh.userData.baseRotationZ || 0;
                    const rotationDiff = targetRotationZ - mesh.rotation.z;
                    
                    if (Math.abs(rotationDiff) > Math.PI) {
                        mesh.rotation.z = targetRotationZ;
                    } else {
                        mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, targetRotationZ, ANIMATION_CONFIG.LERP_FACTOR);
                    }
                }
                
                // Scale up the hovered item
                hoveredItem.scale.set(
                    MathUtils.lerp(hoveredItem.scale.x, INTERACTION_CONFIG.HOVER_SCALE, ANIMATION_CONFIG.LERP_FACTOR * 1.25), 
                    MathUtils.lerp(hoveredItem.scale.y, INTERACTION_CONFIG.HOVER_SCALE, ANIMATION_CONFIG.LERP_FACTOR * 1.25),  
                    MathUtils.lerp(hoveredItem.scale.z, INTERACTION_CONFIG.HOVER_SCALE, ANIMATION_CONFIG.LERP_FACTOR * 1.25)
                );

                
                // Tilt effect animation
                hoveredItem.getWorldPosition(tiltVector);
                tiltVector.project(camera);

                const screenX = tiltVector.x;
                const screenY = tiltVector.y;
                const offsetX = mouse.x - screenX;
                const offsetY = mouse.y - screenY;
                const normalizedX = MathUtils.clamp(offsetX / INTERACTION_CONFIG.PHOTO_SCREEN_SIZE, -1, 1);
                const normalizedY = MathUtils.clamp(offsetY / INTERACTION_CONFIG.PHOTO_SCREEN_SIZE, -1, 1);

                const tiltX = normalizedY * INTERACTION_CONFIG.MAX_TILT;
                const tiltY = normalizedX * INTERACTION_CONFIG.MAX_TILT;

                hoveredItem.rotation.x = MathUtils.lerp(hoveredItem.rotation.x, tiltX, ANIMATION_CONFIG.LERP_FACTOR);
                hoveredItem.rotation.y = MathUtils.lerp(hoveredItem.rotation.y, tiltY, ANIMATION_CONFIG.LERP_FACTOR);

                // Enhanced rim lighting for hovered item
                if (hoveredItem.material.uniforms) {
                    const mouseScreenX = (mouse.x + 1) * 0.5;
                    const mouseScreenY = (mouse.y + 1) * 0.5;
                    
                    hoveredItem.material.uniforms.uMousePosition.value.set(mouseScreenX, mouseScreenY);
                    hoveredItem.material.uniforms.uMouseInfluence.value = MathUtils.lerp(
                        hoveredItem.material.uniforms.uMouseInfluence.value, 
                        1.0, 
                        ANIMATION_CONFIG.LERP_FACTOR
                    );
                }

                // For hovered item, maintain base Z rotation (no additional tilting on Z-axis)
                const targetZ = hoveredItem.userData.baseRotationZ || 0;
                const zDiff = targetZ - hoveredItem.rotation.z;
                
                if (Math.abs(zDiff) > Math.PI) {
                    hoveredItem.rotation.z = targetZ;
                } else if (Math.abs(zDiff) > 0.05) { // Only adjust if significantly off
                    hoveredItem.rotation.z = MathUtils.lerp(
                        hoveredItem.rotation.z, 
                        targetZ, 
                        ANIMATION_CONFIG.LERP_FACTOR * 0.5
                    );
                }
            }
        }

        const visibleMaterials = materials.filter((_, i) => 
            allPhotoMeshes[i].visible
        );

        for (let i = 0; i < visibleMaterials.length; i++) {
            if (visibleMaterials[i].updateLights) {
                visibleMaterials[i].updateLights(lights);
            }
        }

        for (let  i = 0; i < allPhotoMeshes.length; i++) {
            const mesh = allPhotoMeshes[i];

            const distanceToCamera = camera.position.distanceTo(mesh.position);
            if (distanceToCamera > 200) {
                mesh.material.uniforms.uLOD.value = 0.5; // Lower quality for distant objects
            } else {
                mesh.material.uniforms.uLOD.value = 1.0;
            }
        }


        // Periodic memory cleanup
        if (now % 300000 < 16) {
            maintenanceCleanup();
        }
    }

    return photoWheels;
}

export { createWheels }