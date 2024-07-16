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
    Vector3
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

    // Wheel & Gemoetry Sizes
    const wheelRadius = 175;
    const wheelPosition = 208;
    const radianInterval = (2 * Math.PI) / photos.length;
    const geometry = {
        size: 43,
        cornerRadius: 2.5,
        cornerSmoothness: 12,
    }

    let material = null;
    let texture = null;
    const textureLoader = new TextureLoader();
    const roundedRectangleGeometry = RoundedRectangle(
        geometry.size,
        geometry.size,
        geometry.cornerRadius,
        geometry.cornerSmoothness
    );

    // List for all mesh instances
    let photoMeshTop = null;
    let photoMeshBottom = null;
    const allPhotoMeshes = [];

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

    // Move wheels into position
    topGroup.translateY(wheelPosition - 14);
    bottomGroup.translateY(-wheelPosition - 11);
    
    // --- Scroll Event ---
    let spinInProgress = null;
    let scrollSpeed = 0.0;

    document.addEventListener('wheel', event => {
        clearTimeout(spinInProgress);

        for (const mesh of allPhotoMeshes) {
            mesh.scale.set(1, 1, 1);
        }
        
        // Normalize scroll speed
        scrollSpeed = (event.deltaY / 360) / 2;

        topGroup.rotateZ(-scrollSpeed);
        bottomGroup.rotateZ(-scrollSpeed);
        for (const mesh of allPhotoMeshes) {
            mesh.rotateZ(scrollSpeed);
        }

        // Adjust timeout for snapping delay
        spinInProgress = setTimeout(() => {
            snapAfterSpin(topGroup, bottomGroup);
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

        if ( !xDown || !yDown ) { return; }

        let xUp = event.touches[0].clientX;                                    
        let yUp = event.touches[0].clientY;

        let xDiff = xDown - xUp;
        let yDiff = yDown - yUp;
        swipeSpeed = (Math.sqrt((Math.pow(xDiff, 2) + Math.pow(yDiff, 2))) / 360) / 2;
                                                                            
        if ( Math.abs(xDiff) > Math.abs(yDiff) ) {
            if ( xDiff > 0 ) {
                /* right swipe */ 
                console.log("RIGHT", swipeSpeed); 

                topGroup.rotateZ(-swipeSpeed);
                bottomGroup.rotateZ(-swipeSpeed);
                for (const mesh of allPhotoMeshes) {
                    mesh.rotateZ(swipeSpeed);
                }
            } else {
                /* left swipe */
                console.log("LEFT", swipeSpeed);

                topGroup.rotateZ(-swipeSpeed);
                bottomGroup.rotateZ(-swipeSpeed);
                for (const mesh of allPhotoMeshes) {
                    mesh.rotateZ(swipeSpeed);
                }
            }                       
        } else {
            if ( yDiff > 0 ) {
                /* down swipe */ 
                console.log("DOWN", swipeSpeed);

            } else { 
                /* up swipe */
                console.log("UP", swipeSpeed);

            }                                                                 
        }

        topGroup.rotateZ(-swipeSpeed);
        bottomGroup.rotateZ(-swipeSpeed);
        for (const mesh of allPhotoMeshes) {
            mesh.rotateZ(swipeSpeed);
        }

        xDown = xUp;
        yDown = yUp;

        spinInProgress = setTimeout(() => {
            snapAfterSpin(topGroup, bottomGroup);
        }, 350);
    });       
    
    document.addEventListener("touchend", (event) => {
        /* reset values */
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

    photoWheels.tick = () => {
        raycaster.setFromCamera(mouse, camera);
        const rayIntersects = raycaster.intersectObjects(photoWheels.children);

            // ### TODO ### Lerp scaling

        if (!rayIntersects.length) {
            document.body.style.cursor = "default";
            isHovering = false;
            for (const resetMeshScale of allPhotoMeshes) {
                resetMeshScale.scale.set(1, 1, 1);
            }
            return;
        } else {
            for (const intersect of rayIntersects) {
                document.body.style.cursor = "pointer";
                isHovering = true;
                hoveredItem = intersect.object;
                hoveredItem.scale.set(1.1, 1.1, 1.1);
            }
        }
    }

    return photoWheels;
}

function snapAfterSpin (topGroup, bottomGroup) {
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
    /**
     * What's wrong with this approach so far:
     *  - The slerp needs to go in the tick method so that the renderer can show the animation each frame.
     *  - On one side of the wheel, the closest photo is properly calculated, but not the snap angle, causing the title
     *      to update correctly, but a huge over-snap angle.
     */
    // let eulerAngle = new Euler(0, 0, snapAngle);
    // let quaternionSnapAngle = new Quaternion();
    // quaternionSnapAngle.setFromEuler(eulerAngle);
    // topGroup.quaternion.slerp(quaternionSnapAngle, 0.2);
    // bottomGroup.quaternion.slerp(quaternionSnapAngle, 0.2);

    topGroup.rotateZ(snapAngle);
    bottomGroup.rotateZ(snapAngle);
    for (let i = 0; i < topGroup.children.length; i++) {
        topGroup.children[i].rotateZ(-snapAngle);
        bottomGroup.children[i].rotateZ(-snapAngle);
    }

    const projectTitle = document.getElementById('project-title');
    projectTitle.innerHTML = `${closestPhotoMesh.name.projectTitle}`;
}

export { createPhotos }