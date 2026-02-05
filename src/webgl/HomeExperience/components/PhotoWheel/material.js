import { vertexShader } from './shaders/vertexShader.js';
import { fragmentShader } from './shaders/fragmentShader.js';
import {
    ShaderMaterial,
    Vector2,
    Vector3,
    Color,
} from 'three';

function createMaterial(texture) {
    const uniforms = {
        uMap: { value: texture },
        uBorderWidth: { value: 0.05 },
        uBorderIntensity: { value: 1.0 },
        uBorderColor: { value: new Vector3(0.957, 1.0, 0.368) },
        uMousePosition: { value: new Vector2(0, 0) },
        uMouseInfluence: { value: 1.0 },
        uResolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
        uLOD: { value: 1.0 },

        uSpotLight1_position: { value: new Vector3() },
        uSpotLight1_direction: { value: new Vector3() },
        uSpotLight1_color: { value: new Color() },
        uSpotLight1_intensity: { value: 80.0 },
        uSpotLight1_distance: { value: 500.0 },
        uSpotLight1_decay: { value: 2.0 },
        uSpotLight1_coneCos: { value: Math.cos(0.2) },
        uSpotLight1_penumbraCos: { value: Math.cos(0.2 * (1.0 - 0.125)) },

        uSpotLight2_position: { value: new Vector3() },
        uSpotLight2_direction: { value: new Vector3() },
        uSpotLight2_color: { value: new Color() },
        uSpotLight2_intensity: { value: 80.0 },
        uSpotLight2_distance: { value: 500.0 },
        uSpotLight2_decay: { value: 2.0 },
        uSpotLight2_coneCos: { value: Math.cos(0.2) },
        uSpotLight2_penumbraCos: { value: Math.cos(0.2 * (1.0 - 0.125)) },

        uSpotLight3_position: { value: new Vector3() },
        uSpotLight3_direction: { value: new Vector3() },
        uSpotLight3_color: { value: new Color() },
        uSpotLight3_intensity: { value: 80.0 },
        uSpotLight3_distance: { value: 500.0 },
        uSpotLight3_decay: { value: 2.0 },
        uSpotLight3_coneCos: { value: Math.cos(0.2) },
        uSpotLight3_penumbraCos: { value: Math.cos(0.2 * (1.0 - 0.125)) }
    };

    const handleResize = () => {
        uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    const material = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        lights: false,
        transparent: false,
    });

    const updateSingleLight = (light, index) => {
        light.updateWorldMatrix(true, false);
        light.target.updateWorldMatrix(true, false);

        const prefix = `uSpotLight${index}`;
        material.uniforms[`${prefix}_position`].value.setFromMatrixPosition(light.matrixWorld);

        const direction = new Vector3();
        direction.setFromMatrixPosition(light.target.matrixWorld);
        direction.sub(material.uniforms[`${prefix}_position`].value);
        direction.normalize();
        material.uniforms[`${prefix}_direction`].value.copy(direction);

        material.uniforms[`${prefix}_color`].value.copy(light.color);
        material.uniforms[`${prefix}_intensity`].value = light.intensity;
        material.uniforms[`${prefix}_distance`].value = light.distance;
        material.uniforms[`${prefix}_decay`].value = light.decay;
        material.uniforms[`${prefix}_coneCos`].value = Math.cos(light.angle);
        material.uniforms[`${prefix}_penumbraCos`].value = Math.cos(light.angle * (1.0 - light.penumbra));
    };

    material.updateLights = function(lightsGroup) {
        if (!lightsGroup || !lightsGroup.children) return;

        if (!this._lastLightUpdate || performance.now() - this._lastLightUpdate > 16) {
            const spotLights = lightsGroup.children.filter(child => child.isSpotLight);

            spotLights.forEach((light, index) => {
                if (index < 3) {
                    updateSingleLight(light, index + 1);
                }
            });

            this._lastLightUpdate = performance.now();
        }
    };

    material.dispose = function() {
        window.removeEventListener("resize", handleResize);
        ShaderMaterial.prototype.dispose.call(this);
    };

    return material;
}

export { createMaterial };