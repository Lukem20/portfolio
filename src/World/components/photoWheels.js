import {
    TextureLoader,
    Mesh,
    Group,
    Vector2,
    Raycaster,
    SRGBColorSpace,
    MathUtils,
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
    const topGroup = new Group();
    const bottomGroup = new Group();
    
    const materials = [];
    
    
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

        allPhotoMeshes.push(photoMeshTop, photoMeshBottom);
        topGroup.add(photoMeshTop);
        bottomGroup.add(photoMeshBottom);

    }
    
    // Move each photo group after creating and palcing each photo item
    topGroup.translateY(wheelPosition - 14);
    bottomGroup.translateY(-wheelPosition - 11);
    


    /* *** Scroll Event *** */
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



    document.addEventListener('wheel', event => {
        event.preventDefault();

        isSnapping = false
        clearTimeout(spinTimeout);

        // Add to velocity based on scroll direction and intensity
        const scrollIntensity = Math.abs(event.deltaY) / 100;
        const velocityChange = Math.min(scrollIntensity * 0.02, 0.05);
        
        if (event.deltaY > 0) {
            targetVelocity -= velocityChange;
        } else {
            targetVelocity += velocityChange;
        }

        // Clamp velocity
        targetVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, targetVelocity));

        // Set timeout for snapping
        clearTimeout(spinTimeout);
        spinTimeout = setTimeout(() => {
            startSnapping();
        }, 500);
    });



    /* *** Swipe Event *** */
    let xDown = null;                                                        
    let yDown = null;



    document.addEventListener('touchstart', handleTouchStart, false);        

    function handleTouchStart(event) {
        const firstTouch = event.touches[0];                                      
        xDown = firstTouch.clientX;                                      
        yDown = firstTouch.clientY;            
        
        // Stop any current motion when touch starts
        isSnapping = false;
        targetVelocity = 0;
        currentVelocity = 0;
        clearTimeout(spinTimeout);
    }


    document.addEventListener('touchmove', event => {
        if (!xDown || !yDown) { return; }

        let xUp = event.touches[0].clientX;                                    
        let yUp = event.touches[0].clientY;
        let xDiff = xDown - xUp;
        let yDiff = yDown - yUp;

        let swipeSpeed = (Math.sqrt(( Math.pow(xDiff, 2) + Math.pow(yDiff, 2) )) / 360) / 2;
        swipeSpeed = Math.min(swipeSpeed, 0.05);

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            targetVelocity = xDiff > 0 ? -swipeSpeed : swipeSpeed;
        } else {
            targetVelocity = yDiff > 0 ? swipeSpeed : -swipeSpeed;
        }                                                               

        // Reset the swipeSpeed calculation so the wheels don't accelerate
        xDown = xUp;
        yDown = yUp;

        clearTimeout(spinTimeout);
        spinTimeout = setTimeout(() => {
            startSnapping();
        }, 5);
    });       
    


    document.addEventListener("touchend", () => {
        xDown = null;
        yDown = null;
    });



    /* *** Mouse Event *** */
    const mouse = new Vector2();

    container.addEventListener('mousemove', (event) => {
        // Normalize mouse coordinates
        mouse.x = event.clientX / window.innerWidth * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight * 2 - 1);
    });



    /* *** Click Event *** */
    let isHovering = false;
    let hoveredItem = null;
    const raycaster = new Raycaster();

    container.addEventListener('click', () => {
        if (isHovering && !isSnapping && Math.abs(currentVelocity) < 0.01) {
            window.location.href = hoveredItem.name.projectPath;
        } 
    });



    function rotateWheels(angle) {
        topGroup.rotateZ(angle);
        bottomGroup.rotateZ(angle);
        
        for (let i = 0, len = allPhotoMeshes.length; i < len; i++) {
            allPhotoMeshes[i].rotateZ(-angle);
        }
    }



    function startSnapping() {
        const snapData = calculateSnapAngle();
        if (Math.abs(snapData.angle) < 0.01) return; // Already aligned
        
        isSnapping = true;
        snapStartRotation = 0;
        snapTargetRotation = snapData.angle;
        snapProgress = 0;
        
        // Update project title immediately
        const projectTitle = document.getElementById('project-title');
        if (projectTitle && snapData.closestMesh) {
            projectTitle.textContent = `${snapData.closestMesh.name.projectTitle}`;
        }
    }



    function calculateSnapAngle () {

        snapPoint.x = topGroup.children[4].position.x;
        snapPoint.y = topGroup.children[4].position.y;
        snapPoint.theta = Math.atan2(Math.abs(snapPoint.y - topGroup.position.y), Math.abs(snapPoint.x - topGroup.position.x));
        
        let closestPhotoMesh;
        let closestPhotoX = 0.0;
        let closestPhotoY = 0.0;
        let shortestDistance = Infinity

        for (let i = 0, len = topGroup.children.length; i < len; i++) {
            const element = topGroup.children[i];
            tempVector.setFromMatrixPosition(element.matrixWorld);

            // Find the smallest distance from the snap point
            let dx = tempVector.x - snapPoint.x;
            let dy = tempVector.y - snapPoint.y;
            let currentDistance = dx * dx + dy * dy; // Skip sqrt for comparison

            if (currentDistance < shortestDistance) {
                shortestDistance = currentDistance;
                closestPhotoX = tempVector.x;
                closestPhotoY = tempVector.y;
                closestPhotoMesh = element;
            }
        }

        let angleOfClosestPhoto = Math.atan2(Math.abs(closestPhotoY - topGroup.position.y), Math.abs(closestPhotoX - topGroup.position.x));
        let snapAngle = Math.abs(angleOfClosestPhoto - snapPoint.theta);

        // Determines whether the wheels need to be rotated cw or ccw based on the cartesian quadrant it is in.
        if (closestPhotoX > topGroup.position.x && closestPhotoY <= topGroup.position.y) {          // Q1
            snapAngle = angleOfClosestPhoto > snapPoint.theta ? snapAngle : -1.0 * snapAngle;
        } else if (closestPhotoX <= topGroup.position.x && closestPhotoY <= topGroup.position.y) {  // Q2
            snapAngle = angleOfClosestPhoto > snapPoint.theta ? -1.0 * snapAngle : snapAngle;
        } else if (closestPhotoX <= topGroup.position.x && closestPhotoY > topGroup.position.y) {   // Q3
            snapAngle = angleOfClosestPhoto > snapPoint.theta ? snapAngle : -1.0 * snapAngle;
        } else if (closestPhotoX > topGroup.position.x && closestPhotoY >= topGroup.position.y) {   // Q4
            snapAngle = angleOfClosestPhoto > snapPoint.theta ? -1.0 * snapAngle : snapAngle;
        }

        return { angle: snapAngle, closestMesh: closestPhotoMesh };
    }



    let lastHoverCheck = 0;
    const hoverCheckInterval = 16;
    const lerpFactor = 0.3;

    const photoWheels = new Group();
    photoWheels.add(topGroup);
    photoWheels.add(bottomGroup);

    photoWheels.tick = () => {
        const now = performance.now();

        // Handle smooth rotation
        if (isSnapping) {
            // Smooth snapping using eased interpolation
            snapProgress += snapSpeed;
            if (snapProgress >= 1) {
                snapProgress = 1;
                isSnapping = false;
            }
            
            // Use easeOutCubic for smooth deceleration
            const eased = 1 - Math.pow(1 - snapProgress, 3);
            const currentSnapRotation = snapStartRotation + (snapTargetRotation - snapStartRotation) * eased;
            const deltaRotation = currentSnapRotation - snapStartRotation;
            
            rotateWheels(deltaRotation);
            snapStartRotation = currentSnapRotation;
            
            if (snapProgress >= 1) {
                targetVelocity = 0;
                currentVelocity = 0;
            }
        } else {
            // Smooth velocity-based rotation
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


        if (now - lastHoverCheck > hoverCheckInterval) {
            lastHoverCheck = now;

            // Handle hover effects
            raycaster.setFromCamera(mouse, camera);
            const rayIntersects = raycaster.intersectObjects(photoWheels.children);

            if (!rayIntersects.length) {
                /* Not hovering */
                if (isHovering) { // Only change cursor if state changed
                    document.body.style.cursor = "default";
                    isHovering = false;
                }
                
                // 🚀 OPTIMIZATION 10: Batch scale updates with efficient loop
                for (let i = 0, len = allPhotoMeshes.length; i < len; i++) {
                    const mesh = allPhotoMeshes[i];
                    mesh.scale.set(
                        MathUtils.lerp(mesh.scale.x, 1, lerpFactor), 
                        MathUtils.lerp(mesh.scale.y, 1, lerpFactor),  
                        MathUtils.lerp(mesh.scale.z, 1, lerpFactor)
                    );
                }
            } else {
                /* Hovering */ 
                if (!isHovering) { // Only change cursor if state changed
                    document.body.style.cursor = "pointer";
                    isHovering = true;
                }
                
                hoveredItem = rayIntersects[0].object; // Use first intersection
                hoveredItem.scale.set(
                    MathUtils.lerp(hoveredItem.scale.x, 1.03, lerpFactor * 1.25), 
                    MathUtils.lerp(hoveredItem.scale.y, 1.03, lerpFactor * 1.25),  
                    MathUtils.lerp(hoveredItem.scale.z, 1.03, lerpFactor * 1.25)
                );
            }
        }
    }

    return photoWheels;
}


export { createPhotos }