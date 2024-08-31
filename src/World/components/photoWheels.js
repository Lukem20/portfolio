import {
    TextureLoader,
    Mesh,
    Group,
    Vector2,
    Raycaster,
    SRGBColorSpace,
    MathUtils,
    Euler, 
    Quaternion, 
    Vector3,
} from 'three';
import { createMaterial } from './material.js';
import { RoundedRectangle } from './geometry.js';

function createPhotos (camera, container) {
    let photos = [
        {
            imagePath: '/assets/.JPG',
            projectPath: '/projects/haunted-house.html',
            projectTitle: 'Three.js Haunted House'
        },
        {
            imagePath: '/assets/bit.jpg',
            projectPath: '/projects/bit.html',
            projectTitle: 'Brand Identity Timeline'
        },
        {
            imagePath: '/assets/abts1.jpg',
            projectPath: '/projects/abts.html',
            projectTitle: 'Augmented Reality Bike Map'
        },
        {
            imagePath: '/assets/sb2.jpg',
            projectPath: '/projects/sandbox.html',
            projectTitle: 'Three.js Sandbox Environment'
        },
        {
            imagePath: '/assets/sisisBarbershop1.JPG',
            projectPath: '/projects/sb.html',
            projectTitle: "Sisi's Barbershop"
        },
        {
            imagePath: '/assets/hbc1.JPG',
            projectPath: '/projects/hbc.html',
            projectTitle: 'The Healdsburg Crush'
        },
        {
            imagePath: '/assets/7ds1.jpg',
            projectPath: '/projects/7ds.html',
            projectTitle: 'The Seven Deadly Sins'
        },
        {
            imagePath: '/assets/ITBFGLA1.jpg',
            projectPath: '/projects/graphics-textbook.html',
            projectTitle: 'Interactive Graphics Textbook'
        },
        {
            imagePath: '/assets/.JPG',
            projectPath: '/projects/haunted-house.html',
            projectTitle: 'Three.js Haunted House'
        },
        {
            imagePath: '/assets/bit2.jpg',
            projectPath: '/projects/bit.html',
            projectTitle: 'Brand Identity Timeline'
        },
        {
            imagePath: '/assets/abts2.jpg',
            projectPath: '/projects/abts.html',
            projectTitle: 'Augmented Reality Bike Map'
        },
        {
            imagePath: '/assets/sb1.jpg',
            projectPath: '/projects/sandbox.html',
            projectTitle: 'Three.js Sandbox Environment'
        },
        {
            imagePath: '/assets/sisisBarbershop2.JPG',
            projectPath: '/projects/sb.html',
            projectTitle: "Sisi's Barbershop"
        },
        {
            imagePath: '/assets/hbc2.JPG',
            projectPath: '/projects/hbc.html',
            projectTitle: 'The Healdsburg Crush'
        },
        {
            imagePath: '/assets/7ds2.jpg',
            projectPath: '/projects/7ds.html',
            projectTitle: 'Seven Deadly Sins'
        },        
        {
            imagePath: '/assets/ITBFGLA2.jpg',
            projectPath: '/projects/graphics-textbook.html',
            projectTitle: 'Interactive Graphics Textbook'
        },
    ];

    let texture = null;
    let material = null;
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

    let photoMeshTop = null;
    let photoMeshBottom = null;
    const allPhotoMeshes = [];

    const wheelRadius = 175;
    const wheelPosition = 208;
    const radianInterval = (2 * Math.PI) / photos.length;
    const topGroup = new Group();
    const bottomGroup = new Group();

    for (let i = 0; i < photos.length; i++) {

        texture = textureLoader.load(photos[i].imagePath);
        texture.colorSpace = SRGBColorSpace;
        material = createMaterial(texture);

        photoMeshTop = new Mesh(roundedRectangleGeometry, material);
        photoMeshTop.name = photos[i];
        photoMeshTop.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            1
        );

        photoMeshBottom = photoMeshTop.clone();
        photoMeshBottom.name = photos[i];
        photoMeshBottom.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            1
        );

        allPhotoMeshes.push(photoMeshTop);
        allPhotoMeshes.push(photoMeshBottom);
        
        topGroup.add(photoMeshTop);
        bottomGroup.add(photoMeshBottom);
    }

    topGroup.translateY(wheelPosition - 14);
    bottomGroup.translateY(-wheelPosition - 11);
    
    // --- Scroll Event ---
    let spinInProgress = null;
    let scrollSpeed = 0.05;

    document.addEventListener('wheel', event => {
        clearTimeout(spinInProgress);

        for (const mesh of allPhotoMeshes) {
            mesh.scale.set(1, 1, 1);
        }

        if (event.deltaY > 0) {
            topGroup.rotateZ(-scrollSpeed);
            bottomGroup.rotateZ(-scrollSpeed);
 
            for (const mesh of allPhotoMeshes) {
                mesh.rotateZ(scrollSpeed);
            }
        } else {
            topGroup.rotateZ(scrollSpeed);
            bottomGroup.rotateZ(scrollSpeed);

            for (const mesh of allPhotoMeshes) {
                mesh.rotateZ(-scrollSpeed);
            }
        }

        spinInProgress = setTimeout(() => {
            snapAfterSpin(topGroup, bottomGroup, allPhotoMeshes);
        }, 350);
    });

    // --- Swipe Event ---
    let xDown = null;                                                        
    let yDown = null;
    let swipeSpeed = 0.0;

    document.addEventListener('touchstart', handleTouchStart, false);        

    function handleTouchStart(event) {
        const firstTouch = event.touches[0];                                      
        xDown = firstTouch.clientX;                                      
        yDown = firstTouch.clientY;                                      
    };  

    document.addEventListener('touchmove', event => {
        clearTimeout(spinInProgress);

        if (!xDown || !yDown) { return; }

        let xUp = event.touches[0].clientX;                                    
        let yUp = event.touches[0].clientY;
        let xDiff = xDown - xUp;
        let yDiff = yDown - yUp;

        swipeSpeed = (Math.sqrt(( Math.pow(xDiff, 2) + Math.pow(yDiff, 2) )) / 360) / 2;
                                                                            
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) {
                /* right swipe */ 
                topGroup.rotateZ(-swipeSpeed);
                bottomGroup.rotateZ(-swipeSpeed);

                for (const mesh of allPhotoMeshes) {
                    mesh.rotateZ(swipeSpeed);
                }
            } else {
                /* left swipe */
                topGroup.rotateZ(swipeSpeed);
                bottomGroup.rotateZ(swipeSpeed);

                for (const mesh of allPhotoMeshes) {
                    mesh.rotateZ(-swipeSpeed);
                }
            }                       
        } else {
            if ( yDiff > 0 ) {
                /* down swipe */ 
                topGroup.rotateZ(swipeSpeed);
                bottomGroup.rotateZ(swipeSpeed);

                for (const mesh of allPhotoMeshes) {
                    mesh.rotateZ(-swipeSpeed);
                }
            } else { 
                /* up swipe */
                topGroup.rotateZ(-swipeSpeed);
                bottomGroup.rotateZ(-swipeSpeed);

                for (const mesh of allPhotoMeshes) {
                    mesh.rotateZ(swipeSpeed);
                }
            }                                                                 
        }

        /* Reset the swipeSpeed calculation so the wheels don't accelerate */
        xDown = xUp;
        yDown = yUp;

        spinInProgress = setTimeout(() => {
            snapAfterSpin(topGroup, bottomGroup, allPhotoMeshes);
        }, 350);
    });       
    
    document.addEventListener("touchend", (event) => {
        xDown = null;
        yDown = null;
    })

    // --- Mouse Event ---
    const mouse = new Vector2();

    container.addEventListener('mousemove', (event) => {
        // Normalize mouse coordinates
        mouse.x = event.clientX / window.innerWidth * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight * 2 - 1);
    });

    // --- Click Event ---
    let isHovering = false;
    let hoveredItem = null;
    const raycaster = new Raycaster();

    container.addEventListener('click', () => {
        if (isHovering) {
            window.location.href = hoveredItem.name.projectPath;
        } 
    });

    const photoWheels = new Group();
    photoWheels.add(topGroup);
    photoWheels.add(bottomGroup);

    const lerpFactor = 0.3;

    photoWheels.tick = () => {
        raycaster.setFromCamera(mouse, camera);
        const rayIntersects = raycaster.intersectObjects(photoWheels.children);

        if (!rayIntersects.length) {
            /* Not hovering */
            document.body.style.cursor = "default";
            isHovering = false;
            for (const resetMeshScale of allPhotoMeshes) {
                resetMeshScale.scale.set(
                    MathUtils.lerp(resetMeshScale.scale.x, 1, lerpFactor), 
                    MathUtils.lerp(resetMeshScale.scale.y, 1, lerpFactor),  
                    MathUtils.lerp(resetMeshScale.scale.z, 1, lerpFactor)
                );
            }
            
            return;

        } else {
            /* Hovering */ 
            for (const intersect of rayIntersects) {
                document.body.style.cursor = "pointer";
                isHovering = true;
                hoveredItem = intersect.object;
                hoveredItem.scale.set(
                    MathUtils.lerp(hoveredItem.scale.x, 1.1, lerpFactor * 2), 
                    MathUtils.lerp(hoveredItem.scale.y, 1.1, lerpFactor * 2),  
                    MathUtils.lerp(hoveredItem.scale.z, 1.1, lerpFactor * 2)
                );
            }
        }

        // ### TODO ### Slerp snap rotation
    }

    return photoWheels;
}

function snapAfterSpin (topGroup, bottomGroup, allPhotoMeshes) {

    const snapPoint = {
        x: topGroup.children[4].position.x,
        y: topGroup.children[4].position.y,
    }

    snapPoint.theta = Math.atan2(Math.abs(snapPoint.y - topGroup.position.y), Math.abs(snapPoint.x - topGroup.position.x));
    
    let closestPhotoMesh;
    let closestPhotoX = 0.0;
    let closestPhotoY = 0.0;
    let shortestDistance = Infinity

    topGroup.children.forEach((element) => {
        let positionVector = new Vector3().setFromMatrixPosition(element.matrixWorld);

        // Find the smallest distance from the snap point
        let dx = positionVector.x - snapPoint.x;
        let dy = positionVector.y - snapPoint.y;
        let currentDistance = Math.pow(dx, 2) + Math.pow(dy, 2);
        currentDistance = Math.sqrt(currentDistance);

        if (shortestDistance >= currentDistance) {
            shortestDistance = currentDistance;
            closestPhotoX = positionVector.x;
            closestPhotoY = positionVector.y;
            closestPhotoMesh = element;
        }
    });

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

    // ### TODO ### slerp snap rotation to be smooth.
    // let eulerAngle = new Euler(0, 0, snapAngle);
    // let quaternionSnapAngle = new Quaternion();
    // quaternionSnapAngle.setFromEuler(eulerAngle);
    // topGroup.quaternion.slerp(quaternionSnapAngle, 0.2);
    // bottomGroup.quaternion.slerp(quaternionSnapAngle, 0.2);

    topGroup.rotateZ(snapAngle);
    bottomGroup.rotateZ(snapAngle);

    for (const mesh of allPhotoMeshes) {
        mesh.rotateZ(-snapAngle);
    }

    const projectTitle = document.getElementById('project-title');
    projectTitle.innerHTML = `${closestPhotoMesh.name.projectTitle}`;
}

export { createPhotos }