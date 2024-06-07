import {
    MeshStandardMaterial, 
} from 'three';

function createTexture (imagePath, textureLoader) {
    const portfolioScreenshotImage = textureLoader.load(imagePath);
    
    return new MeshStandardMaterial({ 
        map: portfolioScreenshotImage,
        transparent: true,
        opacity: 1
    });
}

export { createTexture };