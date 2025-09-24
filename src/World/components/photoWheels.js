import { createMaterial } from './material.js';
import { RoundedRectangle } from './geometry.js';
import {
    WHEEL_CONFIG,
    GEOMETRY_CONFIG,
    ANIMATION_CONFIG,
    INTERACTION_CONFIG,
    SCROLL_CONFIG,
    PHOTOS_DATA,
} from './PhotoWheels/config.js';
import {
    Group,
    MathUtils,
    Mesh,
    Raycaster,
    SRGBColorSpace,
    TextureLoader,
    Vector2,
    Vector3,
} from 'three';

function createPhotos (camera, container) {
    /**
    * Create geometry, texture, meshes, and photo wheel groups
    */
    const textureLoader = new TextureLoader();
    const roundedRectangleGeometry = RoundedRectangle(
        GEOMETRY_CONFIG.SIZE,
        GEOMETRY_CONFIG.SIZE,
        GEOMETRY_CONFIG.CORNER_RADIUS,
        GEOMETRY_CONFIG.CORNER_SMOOTHNESS
    );
    
    const allPhotoMeshes = [];
    const materials = [];
    const topWheel = new Group();
    const bottomWheel = new Group();

    let renderer = null;
    let isContextLost = false;
    const texturesToDispose = [];
    const materialsToDispose = [];
    
    for (let i = 0; i < PHOTOS_DATA.length; i++) {

        const texture = textureLoader.load(PHOTOS_DATA[i].imagePath);
        texture.colorSpace = SRGBColorSpace;
        texturesToDispose.push(texture);

        const material = createMaterial(texture);
        materials.push(material);
        materialsToDispose.push(material);

        const photoMeshTop = new Mesh(roundedRectangleGeometry, materials[i]);
        photoMeshTop.name = PHOTOS_DATA[i];
        photoMeshTop.position.set(
            Math.cos(WHEEL_CONFIG.RADIAN_INTERVAL * i) * WHEEL_CONFIG.RADIUS,
            Math.sin(WHEEL_CONFIG.RADIAN_INTERVAL * i) * WHEEL_CONFIG.RADIUS,
            1
        );

        const photoMeshBottom = photoMeshTop.clone();
        photoMeshBottom.name = PHOTOS_DATA[i];
        photoMeshBottom.position.set(
            Math.cos(WHEEL_CONFIG.RADIAN_INTERVAL * i) * WHEEL_CONFIG.RADIUS,
            Math.sin(WHEEL_CONFIG.RADIAN_INTERVAL * i) * WHEEL_CONFIG.RADIUS,
            1
        );

        // Store original positions for animations
        photoMeshTop.userData.originalPosition = photoMeshTop.position.clone();
        photoMeshBottom.userData.originalPosition = photoMeshBottom.position.clone();

        allPhotoMeshes.push(photoMeshTop, photoMeshBottom);
        topWheel.add(photoMeshTop);
        bottomWheel.add(photoMeshBottom);
    }
    topWheel.translateY(WHEEL_CONFIG.POSITION + WHEEL_CONFIG.POSITION_OFFSET);
    bottomWheel.translateY(-WHEEL_CONFIG.POSITION + WHEEL_CONFIG.POSITION_OFFSET);


    /**
    * Events and Listener logic
    */

    /* *** Click Event *** */
    let isHovering = false;
    let hoveredItem = null;
    const raycaster = new Raycaster();

    /* *** Mouse Event *** */
    const mouse = new Vector2();
    let mouseMovedSinceLastCheck = false;

    /* *** Touch/Swipe Event *** */
    let xDown = null;                                                        
    let yDown = null;

    /* *** Scroll/Wheel Event *** */
    let targetVelocity = 0;
    let currentVelocity = 0;
    let isSnapping = false;
    let snapStartRotation = 0;
    let snapTargetRotation = 0;
    let snapProgress = 0;
    let spinTimeout = null;

    const tempVector = new Vector3();
    const snapPoint = { x: 0, y: 0, theta: 0 };

    /* *** Converge Animation State *** */
    let isConverging = false;
    let convergeProgress = 0;
    let clickedMesh = null;


    document.addEventListener('wheel', handleWheelEvent);
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove);     
    document.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleMouseClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('pageshow', handlePageShow);
    document.addEventListener('pagehide', handlePageHide);
    
    
    function handleWheelEvent (event) {
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

        const scrollIntensity = Math.abs(event.deltaY) / SCROLL_CONFIG.INTENSITY_DIVISOR;
        let velocityChange = Math.min(
            scrollIntensity * SCROLL_CONFIG.BASE_VELOCITY_CHANGE, 
            SCROLL_CONFIG.MAX_VELOCITY_CHANGE
        );

        if (Math.abs(event.deltaY) < SCROLL_CONFIG.TRACKPAD_THRESHOLD) {
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

        if (event.deltaY > 0) {
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



    function handleMouseMove (event) {
        // Normalize mouse coordinates
        mouse.x = event.clientX / window.innerWidth * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight * 2 - 1);
        mouseMovedSinceLastCheck = true;
    }



    function handleMouseClick() {
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
        console.log('WebGL context restored')
        isContextLost = true;
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
            window.location.href = hoveredItem.name.projectPath;
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
        // Reset position to original
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
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('pageshow', handlePageShow);
        document.removeEventListener('pagehide', handlePageHide);  
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('click', handleMouseClick);

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
        if (window.gc) {
            window.gc();
        }

        for (let i = 0; i < allPhotoMeshes.length; i++) {
            const mesh = allPhotoMeshes[i];

            if (mesh.userData.baseRotationZ) {
                // Normalize rotation to prevent accumulation
                mesh.userData.baseRotationZ = mesh.userData.baseRotationZ % (2 * Math.PI);
            }
        }
    }



    function setupWebGLListeners(rendererInstance) {
        renderer = rendererInstance;
        const canvas = renderer.domElement;
        
        canvas.addEventListener('webglcontextlost', handleContextLoss, false);
        canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
    }



    /**
    * Animation Loop   
    */
    let lastHoverCheck = 0;
    const tiltVector = new Vector3();
    const photoWheels = new Group();
    photoWheels.add(topWheel);
    photoWheels.add(bottomWheel);


    photoWheels.tick = () => {
        if (isContextLost) {
            return;
        }

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
            if (isSnapping) {
                snapProgress += ANIMATION_CONFIG.SNAP_SPEED;

                if (snapProgress >= 1) {
                    snapProgress = 1;
                    isSnapping = false;
                    targetVelocity = 0;
                    currentVelocity = 0;

                    setTimeout(() => forceHoverCheck(), 0);
                }
                
                const eased = 1 - Math.pow(1 - snapProgress, 3);
                const currentSnapRotation = snapStartRotation + (snapTargetRotation - snapStartRotation) * eased;
                const deltaRotation = currentSnapRotation - snapStartRotation;
                
                rotateWheels(deltaRotation);
                snapStartRotation = currentSnapRotation;
                
                if (snapProgress >= 1) {
                    targetVelocity = 0;
                    currentVelocity = 0;
                }
            } 


            // Scroll wheels Animation
            else { 
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

            raycaster.setFromCamera(mouse, camera);
            const rayIntersects = raycaster.intersectObjects(allPhotoMeshes);

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

        // Periodic memory cleanup
        if (now % 300000 < 16) {
            maintenanceCleanup();
        }
    }

    photoWheels.cleanup = cleanupEventListeners;
    photoWheels.setupWebGL = setupWebGLListeners;
    photoWheels.disposeResources = disposeResources;

    return photoWheels;
}

export { createPhotos }