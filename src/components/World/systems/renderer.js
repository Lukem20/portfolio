import { 
    WebGLRenderer,
    LinearSRGBColorSpace,
} from 'three';

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = LinearSRGBColorSpace;
    renderer.setClearColor('#262837');

    return renderer;
}

export { createRenderer }