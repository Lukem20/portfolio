import { 
    WebGLRenderer,
} from 'three';

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x22252D);

    return renderer;
}

export { createRenderer }