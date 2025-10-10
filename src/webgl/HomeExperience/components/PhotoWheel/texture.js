import {
    SRGBColorSpace,
    LinearFilter
} from 'three'

function createTexture(loader, path) {
    const texture = loader.load(path);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;

    return texture;
}

export { createTexture }; 