import {
    ShaderMaterial,
    PlaneGeometry,
    Mesh,
    Color,
} from 'three';


export default class Background {
    constructor() {
        this.uniforms =  {
            'centerColor': { value: new Color( 0x0077ff ) },
            'outerColor': { value: new Color( 0xffffff ) },
        }

        this.sizes = {
            height: 400,
            width: 400,
        }

        this.geometry = null;
        this.geometry = null;
        this.material = null;

        this.vertexShader = `
            varying vec2 vUv;

            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

                vUv = uv;
            }
        `;

        this.fragmentShader = `
            varying vec2 vUv;

            void main() {

                float strength = distance(vUv, vec2(0.5)) * 0.1;

                vec3 yellowColor = vec3(0.957, 1.0, 0.369); // #F4FF5E
                vec3 blackColor = vec3(0.0);

                vec3 mixedColor = mix(blackColor, yellowColor, strength);

                gl_FragColor = vec4(mixedColor, 1.0);
            }
        `;

        this.createMesh();
    }


    createMesh() {
        this.geometry = new PlaneGeometry(this.sizes.width, this.sizes.height);;
        this.material = new ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
        });
        this.mesh = new Mesh(this.geometry, this.material);
        this.mesh.receiveShadow = true;
        this.mesh.position.z = -3.5
    }
}