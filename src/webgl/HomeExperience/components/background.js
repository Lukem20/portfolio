import {
    ShaderMaterial,
    PlaneGeometry,
    Mesh,
    Color,
} from 'three';

function createBackground () {
    
    const uniforms = {
        'centerColor': { value: new Color( 0x0077ff ) },
        'outerColor': { value: new Color( 0xffffff ) },
    };
    
    const vertexShader = `
        varying vec2 vUv;

        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vUv = uv;
        }
    `;
    
    const fragmentShader = `
        varying vec2 vUv;

        void main() {

            float strength = distance(vUv, vec2(0.5)) * 0.05;

            vec3 yellowColor = vec3(0.957, 1.0, 0.369); // #F4FF5E
            vec3 blackColor = vec3(0.0);

            vec3 mixedColor = mix(blackColor, yellowColor, strength);

            gl_FragColor = vec4(mixedColor, 1.0);
        }
    `;
    
    const sizes = {
        height: 400,
        width: 400,
    };

    const geometry = new PlaneGeometry(sizes.width, sizes.height);
    const material = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    });

    const backgroundMesh = new Mesh(geometry, material);
    backgroundMesh.receiveShadow = true;
    backgroundMesh.position.z = -3.5

    return backgroundMesh;
}

export { createBackground };