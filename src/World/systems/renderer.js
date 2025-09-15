import { 
    WebGLRenderer,
} from 'three';

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x1c1f25);

    return renderer;
}

export { createRenderer }