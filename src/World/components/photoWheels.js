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

function createPhotos (camera) {
    let photos = [
        '/assets/whatDesigner1.JPG',
        '/assets/bit.jpg',
        '/assets/abts1.jpg',
        '/assets/sb2.jpg',
        '/assets/sisisBarbershop1.JPG',
        '/assets/hbc1.JPG',
        '/assets/color.jpg',
        '/assets/color.jpg',
        // Make top and bottom half of this array same project order.
        '/assets/whatDesigner2.JPG',
        '/assets/bit2.jpg',
        '/assets/abts2.jpg',
        '/assets/sb1.jpg',
        '/assets/sisisBarbershop2.JPG',
        '/assets/hbc2.JPG',
        '/assets/color.jpg',
        '/assets/color.jpg',
    ];

    const wheelRadius = 180;
    const wheelPosition = 213.5;
    const radianInterval = (2 * Math.PI) / photos.length;
    const geometry = {
        size: 45,
        cornerRadius: 4,
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
        texture = textureLoader.load(photos[i])
        material = createMaterial(texture);

        photoMeshTop = new Mesh(roundedRectangleGeometry, material);
        photoMeshTop.name = photos[i];
        photoMeshTop.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            1
        );
        allPhotoMeshes.push(photoMeshTop);

        photoMeshBottom = photoMeshTop.clone();
        photoMeshBottom.name = photos[i];
        photoMeshBottom.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            1
        );
        allPhotoMeshes.push(photoMeshBottom);
        
        topGroup.add(photoMeshTop);
        bottomGroup.add(photoMeshBottom);
    }

    topGroup.translateY(wheelPosition);
    bottomGroup.translateY(-wheelPosition);
    
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

        // Adjust timeout time for snapping delay after the wheel stops spinning.
        spinInProgress = setTimeout(() => {
            snapAfterSpin(topGroup, bottomGroup);
        }, 350);
    });

    // --- Mouse Event ---
    const mouse = new Vector2();
    window.addEventListener('mousemove', (event) => {
        // Normalized mouse coordinates
        mouse.x = event.clientX / window.innerWidth * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight * 2 - 1);
    });

    /**
     * TODO
     * Need to store details in the mesh object about what project page should
     * open when that mesh is clicked. 
     * 
     * Current strategy is to couple the hovering and clicking logic together,
     * but when this event is triggered, isHovering is always true and hoveredItem is undefined (not null);
     */
    // --- Click Event ---
    let isHovering = false;
    let hoveredItem = null;
    window.addEventListener('click', (isHovering, hoveredItem) => {
        if (isHovering) {
            console.log("Hovering ", hoveredItem)
        } else {
            console.log("Not hovering")
        }
    });

    const raycaster = new Raycaster();
    const photoWheels = new Group();
    photoWheels.add(topGroup);
    photoWheels.add(bottomGroup);

    photoWheels.tick = () => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(photoWheels.children);

            // TODO - Lerp scaling

        // Reset photos scale back to normal
        for (const allOtherPhotos of allPhotoMeshes) {
            allOtherPhotos.scale.set(1, 1, 1);
        }

        // If no raycast intersections, we are not hovering
        if (!intersects.length) {
            isHovering = false;
            return;
        } else {
            for (const intersect of intersects) {
                hoveredItem = intersect.object;
                hoveredItem.scale.set(1.1, 1.1, 1.1);
                isHovering = true;
            }
        }
    }

    return photoWheels;
}

export { createPhotos }