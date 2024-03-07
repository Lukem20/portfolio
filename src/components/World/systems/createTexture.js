import {
    MeshStandardMaterial, 
    TextureLoader,
} from 'three';

async function createTexture (imagePath) {
    const textureLoader = new TextureLoader();
    const portfolioScreenshotImage = textureLoader.load(imagePath);
    
    return new MeshStandardMaterial({ 
        map: portfolioScreenshotImage,
        transparent: true,
        opacity: 1
    });
}

export { createTexture };