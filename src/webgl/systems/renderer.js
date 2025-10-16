import { 
    WebGLRenderer,
    LinearSRGBColorSpace,
} from 'three';

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x1c1f25);
    renderer.outputColorSpace = LinearSRGBColorSpace;

    return renderer;
}

export { createRenderer }