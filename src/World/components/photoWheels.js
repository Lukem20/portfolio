import {
    TextureLoader,
    Mesh,
    Group,
    Vector2,
    Raycaster,
    MathUtils
} from 'three';
import { createMaterial } from './material.js';
import { RoundedRectangle } from './geometry.js';
import { snapAfterSpin } from './pw-snapAfterSpin.js';

function createPhotos (camera, container) {
    let photos = [
        {
            imagePath: '/assets/.JPG',
            projectPath: '/projects/haunted-house.html',
            projectTitle: 'Haunted House'
        },
        {
            imagePath: '/assets/bit.jpg',
            projectPath: '/projects/bit.html',
            projectTitle: 'Brand Identity Timeline'
        },
        {
            imagePath: '/assets/abts1.jpg',
            projectPath: '/projects/abts.html',
            projectTitle: 'Augemented Reality Bike Map'
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
            projectTitle: 'The Interactive Graphics Textbook'
        },
        {
            imagePath: '/assets/.JPG',
            projectPath: '/projects/haunted-house.html',
            projectTitle: 'Haunted House'
        },
        {
            imagePath: '/assets/bit2.jpg',
            projectPath: '/projects/bit.html',
            projectTitle: 'Brand Identity Timeline'
        },
        {
            imagePath: '/assets/abts2.jpg',
            projectPath: '/projects/abts.html',
            projectTitle: 'Augemented Reality Bike Map'
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
            projectTitle: 'The Interactive Graphics Textbook'
        },
    ];

    const wheelRadius = 180;
    const wheelPosition = 213.5;
    const radianInterval = (2 * Math.PI) / photos.length;
    const geometry = {
        size: 45,
        cornerRadius: 2.5,
        cornerSmoothness: 12,
    }

    let photoMeshTop = null;
    let photoMeshBottom = null;
    const allPhotoMeshes = [];
    let material = null;
    let texture = null;
    const textureLoader = new TextureLoader();
    const roundedRectangleGeometry = RoundedRectangle(
        geometry.size,
        geometry.size,
        geometry.cornerRadius,
        geometry.cornerSmoothness
    );

    const topGroup = new Group();
    const bottomGroup = new Group();

    // Create meshes and places them in a circle.
    for (let i = 0; i < photos.length; i++) {
        texture = textureLoader.load(photos[i].imagePath);
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

    topGroup.translateY(wheelPosition - 16);
    bottomGroup.translateY(-wheelPosition - 11);
    
    // --- Rotate Wheel Event ---
    let spinInProgress = null;
    let scrollSpeed = 0.0;

    document.addEventListener('wheel', event => {
        clearTimeout(spinInProgress);

        for (const mesh of allPhotoMeshes) {
            mesh.scale.set(1, 1, 1);
        }
        
        // Normalized scroll speed
        scrollSpeed = (event.deltaY / 360) / 2;
        topGroup.rotateZ(-scrollSpeed);
        bottomGroup.rotateZ(-scrollSpeed);

        for (const mesh of allPhotoMeshes) {
            mesh.rotateZ(scrollSpeed);
        }

        // Adjust timeout for snapping delay after the wheel stops spinning.
        spinInProgress = setTimeout(() => {
            snapAfterSpin(topGroup, bottomGroup);
        }, 350);
    });

    // --- Mouse Event ---
    const mouse = new Vector2();
    container.addEventListener('mousemove', (event) => {
        // Normalize mouse coordinates
        mouse.x = event.clientX / window.innerWidth * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight * 2 - 1);
    });

    // --- Click Event ---
    var isHovering = false;
    var hoveredItem = null;

    container.addEventListener('click', () => {
        if (isHovering) {
            console.log("Mesh clicked", hoveredItem);
            window.location.href = hoveredItem.name.projectPath;
        } 
    });

    // ### TODO ### Debug the raycaster, it is offset
    const raycaster = new Raycaster();
    const photoWheels = new Group();
    photoWheels.add(topGroup);
    photoWheels.add(bottomGroup);

    photoWheels.tick = () => {
        raycaster.setFromCamera(mouse, camera);
        const rayIntersects = raycaster.intersectObjects(photoWheels.children);

            // ### TODO ### Lerp scaling

        for (const resetMeshScale of allPhotoMeshes) {
            resetMeshScale.scale.set(1, 1, 1);
        }

        if (!rayIntersects.length) {
            document.body.style.cursor = "default";
            isHovering = false;
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

export { createPhotos }