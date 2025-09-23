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
import { createMaterial } from './material.js';
import { RoundedRectangle } from './geometry.js';



function createPhotos (camera, container) {

    let photos = [
        {
            imagePath: '/assets/haunted-house-square-1.jpg',
            projectPath: '/projects/HauntedHouse.html',
            projectTitle: 'Three.js Haunted House'
        },
        {
            imagePath: '/assets/brand-identity-timeline-square-2.jpg',
            projectPath: '/projects/BrandIdentityTimeline.html',
            projectTitle: 'Brand Identity Timeline'
        },
        {   // Replace image path
            imagePath: '/assets/abts1.jpg',
            projectPath: '/projects/BotanyBlog.html',
            projectTitle: 'Botany Blog'
        },
        {
            imagePath: '/assets/sandbox-square-2.jpg',
            projectPath: '/projects/ThreejsSandbox.html',
            projectTitle: 'Three.js Sandbox Environment'
        },
        {
            imagePath: '/assets/sisis-barbershop-square-1.jpg',
            projectPath: '/projects/SisisBarbershop.html',
            projectTitle: "Sisi's Barbershop"
        },
        {
            imagePath: '/assets/healdsburg-crush-square-1.jpg',
            projectPath: '/projects/HealdsburgCrush.html',
            projectTitle: 'The Healdsburg Crush'
        },
        {
            imagePath: '/assets/seven-deadly-sins-square-1.jpg',
            projectPath: '/projects/SevenDeadlySins.html',
            projectTitle: 'The Seven Deadly Sins'
        },
        {
            imagePath: '/assets/graphics-textbook-square-1.jpg',
            projectPath: '/projects/GraphicsInteractiveTextbook.html',
            projectTitle: 'Interactive Graphics Textbook'
        },
        {
            imagePath: '/assets/haunted-house-square-2.jpg',
            projectPath: '/projects/HauntedHouse.html',
            projectTitle: 'Three.js Haunted House'
        },
        {
            imagePath: '/assets/brand-identity-timeline-square-2.jpg',
            projectPath: '/projects/BrandIdentityTimeline.html',
            projectTitle: 'Brand Identity Timeline'
        },
        {   // Replace image path
            imagePath: '/assets/abts2.jpg',
            projectPath: '/projects/BotanyBlog.html',
            projectTitle: 'Botany Blog'
        },
        {
            imagePath: '/assets/sandbox-square-1.jpg',
            projectPath: '/projects/ThreejsSandbox.html',
            projectTitle: 'Three.js Sandbox Environment'
        },
        {
            imagePath: '/assets/sisis-barbershop-square-2.jpg',
            projectPath: '/projects/SisisBarbershop.html',
            projectTitle: "Sisi's Barbershop"
        },
        {
            imagePath: '/assets/healdsburg-crush-square-2.jpg',
            projectPath: '/projects/HealdsburgCrush.html',
            projectTitle: 'The Healdsburg Crush'
        },
        {
            imagePath: '/assets/seven-deadly-sins-square-2.jpg',
            projectPath: '/projects/SevenDeadlySins.html',
            projectTitle: 'Seven Deadly Sins'
        },        
        {
            imagePath: '/assets/graphics-textbook-square-2.jpg',
            projectPath: '/projects/GraphicsInteractiveTextbook.html',
            projectTitle: 'Interactive Graphics Textbook'
        },
    ];



    /* *** Create Photo geometry and material *** */
    const textureLoader = new TextureLoader();
    const geometry = {
        size: 43,
        cornerRadius: 2.5,
        cornerSmoothness: 12,
    }
    
    const roundedRectangleGeometry = RoundedRectangle(
        geometry.size,
        geometry.size,
        geometry.cornerRadius,
        geometry.cornerSmoothness
    );
    
    const wheelRadius = 175;
    const wheelPosition = 208;
    const radianInterval = (2 * Math.PI) / photos.length;
    const allPhotoMeshes = [];
    const materials = [];
    const topGroup = new Group();
    const bottomGroup = new Group();
    
    // Create photo meshes, then create wheels.
    for (let i = 0; i < photos.length; i++) {

        const texture = textureLoader.load(photos[i].imagePath);
        texture.colorSpace = SRGBColorSpace;
        materials.push(createMaterial(texture));

        const photoMeshTop = new Mesh(roundedRectangleGeometry, materials[i]);
        photoMeshTop.name = photos[i];
        photoMeshTop.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            1
        );

        const photoMeshBottom = photoMeshTop.clone();
        photoMeshBottom.name = photos[i];
        photoMeshBottom.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            1
        );

        // Store original positions for animations
        photoMeshTop.userData.originalPosition = photoMeshTop.position.clone();
        photoMeshBottom.userData.originalPosition = photoMeshBottom.position.clone();

        // Create array of all photo meshes. Add photos to each wheel group.
        allPhotoMeshes.push(photoMeshTop, photoMeshBottom);
        topGroup.add(photoMeshTop);
        bottomGroup.add(photoMeshBottom);
    }
    topGroup.translateY(wheelPosition - 13);
    bottomGroup.translateY(-wheelPosition - 13);
    



    /* *** Click Event *** */
    let isHovering = false;
    let hoveredItem = null;
    const raycaster = new Raycaster();

    /* *** Mouse Event *** */
    const mouse = new Vector2();

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

    const friction = 0.87;
    const velocityThreshold = 0.001;
    const snapSpeed = 0.04;
    const maxVelocity = 0.15;

    const tempVector = new Vector3();
    const snapPoint = { x: 0, y: 0, theta: 0 };

    /* *** Converge Animation State *** */
    let isConverging = false;
    let convergeProgress = 0;
    let clickedMesh = null;
    const convergeSpeed = 0.025;
    const stackOffset = -2.5;
    const convergeDuration = 650; // milliseconds



    document.addEventListener('wheel', handleWheelEvent);
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove);     
    document.addEventListener("touchend", handleTouchEnd);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleMouseClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    
    
    function handleWheelEvent (event) {
        event.preventDefault();

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

        // Add to velocity based on scroll direction and intensity
        const scrollIntensity = Math.abs(event.deltaY) / 100;
        const velocityChange = Math.min(scrollIntensity * 0.02, 0.05);
        
        if (event.deltaY > 0) {
            targetVelocity -= velocityChange;
        } else {
            targetVelocity += velocityChange;
        }

        // Clamp velocity [-maxVelocity, maxVelocity]
        targetVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, targetVelocity));

        // Set timeout for snapping
        clearTimeout(spinTimeout);
        spinTimeout = setTimeout(snapWheels, 500);
    }



    function handleTouchStart(event) {
        const firstTouch = event.touches[0];                                      
        xDown = firstTouch.clientX;                                      
        yDown = firstTouch.clientY; 
        
        if(isConverging) {
            endConvergeAnimation();
        }
        
        // Stop any current motion when touch starts
        isSnapping = false;
        targetVelocity = 0;
        currentVelocity = 0;
        clearTimeout(spinTimeout);
    }



    function handleTouchMove(event) {
        if (!xDown || !yDown) { return; }

        let xUp = event.touches[0].clientX;                                    
        let yUp = event.touches[0].clientY;
        let xDiff = xDown - xUp;
        let yDiff = yDown - yUp;

        let swipeSpeed = (Math.sqrt(( Math.pow(xDiff, 2) + Math.pow(yDiff, 2) )) / 360) / 2;
        swipeSpeed = Math.min(swipeSpeed, 0.75);

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            targetVelocity = xDiff > 0 ? -swipeSpeed : swipeSpeed;
        } else {
            targetVelocity = yDiff > 0 ? swipeSpeed : -swipeSpeed;
        }                                                               

        // Reset the swipeSpeed calculation so the wheels don't accelerate
        xDown = xUp;
        yDown = yUp;

        clearTimeout(spinTimeout);
        spinTimeout = setTimeout(snapWheels, 350);
    }


    
    function handleTouchEnd() {
        xDown = null;
        yDown = null;
    }



    function handleMouseMove (event) {
        // Normalize mouse coordinates
        mouse.x = event.clientX / window.innerWidth * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight * 2 - 1);
    }



    function handleMouseClick() {
        if (isHovering && !isSnapping && Math.abs(currentVelocity) < 0.01) {

            // Start click animation
            if (!isConverging) {
                startConvergeAnimation(hoveredItem);
            } else {
                window.location.href = hoveredItem.name.projectPath;
            }
        } 
    }



    function handleVisibilityChange() {
        if (document.hidden && isConverging) {
            endConvergeAnimation();
        }
    }



    function startConvergeAnimation(mesh) {

        resetAllMeshUserData();

        isConverging = true;
        convergeProgress = 0;
        clickedMesh = mesh;

        let clickedInTopWheel = topGroup.children.includes(mesh);
        let topTarget, bottomTarget;

        if (clickedInTopWheel) {
            topTarget = mesh;
            let clickedIndex = topGroup.children.indexOf(mesh);
            let totalPhotos = topGroup.children.length;
            let oppositeIndex = (clickedIndex + Math.floor(totalPhotos / 2)) % totalPhotos;
            bottomTarget = bottomGroup.children[oppositeIndex];
        } else {
            bottomTarget = mesh;
            let clickedIndex = bottomGroup.children.indexOf(mesh);
            let totalPhotos = bottomGroup.children.length;
            let oppositeIndex = (clickedIndex + Math.floor(totalPhotos / 2)) % totalPhotos;
            topTarget = topGroup.children[oppositeIndex];
        }

        // Stop other animations
        isSnapping = false;
        targetVelocity = 0;
        currentVelocity = 0;
        clearTimeout(spinTimeout);

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
            let clickedInTopWheel = topGroup.children.includes(photoMesh);
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
            photoMesh.userData.radius = wheelRadius;
            photoMesh.userData.startZ = photoMesh.userData.startPosition.z;
            photoMesh.userData.targetZ = target.position.z + stackOffset;
            photoMesh.userData.zDiff = photoMesh.userData.targetZ - photoMesh.userData.startZ;
        }

        setTimeout(() => {
            cleanupEventListeners();
            window.location.href = hoveredItem.name.projectPath;
        }, convergeDuration);
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

        topGroup.rotateZ(angle);
        bottomGroup.rotateZ(angle);
        
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



    function snapWheels() {
        if (isConverging) return;

        const snapData = calculateSnapAngle(topGroup);

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
        for (let i = 0, len = topGroup.children.length; i < len; i++) {
            const element = topGroup.children[i];
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
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('click', handleMouseClick);
    }



    /* *** Animation loop *** */
    let lastHoverCheck = 0;
    const hoverCheckInterval = 16;
    const lerpFactor = 0.3;

    const photoWheels = new Group();
    photoWheels.add(topGroup);
    photoWheels.add(bottomGroup);

    photoWheels.tick = () => {
        const now = performance.now();

        // Converge on click animation
        if (isConverging) {
            convergeProgress += convergeSpeed;

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
                snapProgress += snapSpeed;

                if (snapProgress >= 1) {
                    snapProgress = 1;
                    isSnapping = false;
                    targetVelocity = 0;
                    currentVelocity = 0;
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
                targetVelocity *= friction;
                
                // Stop very small movements
                if (Math.abs(targetVelocity) < velocityThreshold) {
                    targetVelocity = 0;
                }
                if (Math.abs(currentVelocity) < velocityThreshold) {
                    currentVelocity = 0;
                }
                
                if (currentVelocity !== 0) {
                    rotateWheels(currentVelocity);
                }
            }
        }

 

        // Hover effects animation
        if (!isConverging && now - lastHoverCheck > hoverCheckInterval) {
            lastHoverCheck = now;

            raycaster.setFromCamera(mouse, camera);
            const rayIntersects = raycaster.intersectObjects(photoWheels.children);

            // Not hovering
            if (!rayIntersects.length) {
                if (isHovering) {
                    document.body.style.cursor = "default";
                    isHovering = false;
                }
                    
                for (let i = 0, len = allPhotoMeshes.length; i < len; i++) {
                    const mesh = allPhotoMeshes[i];
                    mesh.scale.set(
                        MathUtils.lerp(mesh.scale.x, 1, lerpFactor), 
                        MathUtils.lerp(mesh.scale.y, 1, lerpFactor),  
                        MathUtils.lerp(mesh.scale.z, 1, lerpFactor)
                    );

                    mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, 0, lerpFactor);
                    mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, 0, lerpFactor);

                    const targetRotationZ = mesh.userData.baseRotationZ || 0;
                    const rotationDiff = targetRotationZ - mesh.rotation.z;

                    if (Math.abs(rotationDiff) > Math.PI) {
                        mesh.rotation.z = targetRotationZ;
                    } else {
                        mesh.rotation.z = MathUtils.lerp(
                            mesh.rotation.z, 
                            targetRotationZ, 
                            lerpFactor
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
                            MathUtils.lerp(mesh.scale.x, 1, lerpFactor), 
                            MathUtils.lerp(mesh.scale.y, 1, lerpFactor),  
                            MathUtils.lerp(mesh.scale.z, 1, lerpFactor)
                        );
                    }

                    mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, 0, lerpFactor);
                    mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, 0, lerpFactor);

                    // Handle Z rotation carefully for non-hovered items
                    const targetRotationZ = mesh.userData.baseRotationZ || 0;
                    const rotationDiff = targetRotationZ - mesh.rotation.z;
                    
                    if (Math.abs(rotationDiff) > Math.PI) {
                        mesh.rotation.z = targetRotationZ;
                    } else {
                        mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, targetRotationZ, lerpFactor);
                    }
                }
                
                // Scale up the hovered item
                hoveredItem.scale.set(
                    MathUtils.lerp(hoveredItem.scale.x, 1.03, lerpFactor * 1.25), 
                    MathUtils.lerp(hoveredItem.scale.y, 1.03, lerpFactor * 1.25),  
                    MathUtils.lerp(hoveredItem.scale.z, 1.03, lerpFactor * 1.25)
                );

                // Tilt effect animation
                const photoWorldPosition = new Vector3();
                hoveredItem.getWorldPosition(photoWorldPosition);
                photoWorldPosition.project(camera);

                const screenX = photoWorldPosition.x;
                const screenY = photoWorldPosition.y;
                const offsetX = mouse.x - screenX;
                const offsetY = mouse.y - screenY;
                const photoScreenSize = 0.15;
                const normalizedX = MathUtils.clamp(offsetX / photoScreenSize, -1, 1);
                const normalizedY = MathUtils.clamp(offsetY / photoScreenSize, -1, 1);

                const maxTilt = Math.PI / 30;
                const tiltX = normalizedY * maxTilt;
                const tiltY = normalizedX * maxTilt;

                hoveredItem.rotation.x = MathUtils.lerp(hoveredItem.rotation.x, tiltX, lerpFactor);
                hoveredItem.rotation.y = MathUtils.lerp(hoveredItem.rotation.y, tiltY, lerpFactor);

                // For hovered item, maintain base Z rotation (no additional tilting on Z-axis)
                const targetZ = hoveredItem.userData.baseRotationZ || 0;
                const zDiff = targetZ - hoveredItem.rotation.z;
                
                if (Math.abs(zDiff) > Math.PI) {
                    hoveredItem.rotation.z = targetZ;
                } else if (Math.abs(zDiff) > 0.05) { // Only adjust if significantly off
                    hoveredItem.rotation.z = MathUtils.lerp(
                        hoveredItem.rotation.z, 
                        targetZ, 
                        lerpFactor * 0.5
                    );
                }
            }
        }
    }

    return photoWheels;
}


export { createPhotos }