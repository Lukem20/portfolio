import { createTexture } from '../systems/createTexture.js';
import { 
    PlaneGeometry, 
    Mesh,
    Group,
} from 'three';

function createPhotos (gui) {
    // A group for each wheel individually, one group for both wheels.
    let topGroup = new Group();
    let bottomGroup = new Group();
    const bothGalleries = new Group();

    // Square picture objects
    let screenshotPaths = [
        'src/images/sisisBarbershop1.JPG',
        'src/images/hbc1.JPG',
        'src/images/whatDesigner1.JPG',
        'src/images/sb2.jpg',
        'src/images/color.jpg',
        'src/images/color.jpg',
        'src/images/sisisBarbershop2.JPG',
        'src/images/hbc2.JPG',
        'src/images/whatDesigner2.JPG',
        'src/images/sb1.jpg',
        'src/images/color.jpg',
        'src/images/color.jpg',
    ];

    const numImages = screenshotPaths.length;
    const size = 100;
    const geometry = new PlaneGeometry(size, size);

    // Position and angle parameters for each mesh
    const wheelRadius = 220;
    let radianInterval = (2 * Math.PI) / numImages;

    // Creating image wheels
    let material = null;
    let topMesh = null;
    let bottomMesh = null;

    for (let i = 0; i < numImages; i++) {
        material = createTexture(screenshotPaths[i]);

        // Top photo wheel
        topMesh = new Mesh(geometry, material);
        topMesh.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            i * (-1 * i * 0.01)
        );
        topGroup.add(topMesh);

        // Bottom photo wheel
        bottomMesh = topMesh.clone();
        bottomMesh.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            i * (-1 * i * 0.01)
        );
        bottomGroup.add(bottomMesh);

    }

    topGroup.translateY(290);
    bottomGroup.translateY(-290);
    
    // Scroll event listeners
    let scrollSpeed = 0.0;
    document.addEventListener('wheel', event => {
        scrollSpeed = event.deltaY * (Math.PI / 180) * 0.08;
        topGroup.rotateZ(-1.0 * scrollSpeed);
        bottomGroup.rotateZ(-1.0 * scrollSpeed);

        // Adjust photo rotation after scroll movement
        for (let i = 0; i < numImages; i++) {
            topGroup.children[i].rotateZ(scrollSpeed);
            bottomGroup.children[i].rotateZ(scrollSpeed);
        }
    });

    // Debug panel - remove before deploy
    const params = {};
    params.imageSize = size;


    gui.add(params, 'imageSize', 100, 500, 1);

    bothGalleries.add(topGroup);
    bothGalleries.add(bottomGroup);
    return bothGalleries;
}

export { createPhotos }