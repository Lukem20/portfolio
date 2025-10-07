"use strict";
import { vertexShader } from './vertexShader';
import { fragmentShader } from './fragmentShader';
import { 
    ShaderMaterial,
    Vector2,
    Vector3,
    Color,
} from 'three';

function createMaterial (texture) {    
    const uniforms = {
        uMap: { value: texture },
        uBorderWidth: { value: 0.05 },
        uBorderIntensity : { value: 1.0 },
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
    }


    window.addEventListener("resize", () => {
        uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });


    const material = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        lights: false,
        transparent: false,
    });

    
    material.updateLights = function(lightsGroup) {
        if (!lightsGroup || !lightsGroup.children) return;

        if (!this._lastLightUpdate || performance.now() - this._lastLightUpdate > 16) {
            const spotLights = lightsGroup.children.filter(child => child.isSpotLight);
            
            if (spotLights[0]) {
                const light = spotLights[0];
                // Update world position since lights group may be transformed
                light.updateWorldMatrix(true, false);
                light.target.updateWorldMatrix(true, false);
                
                this.uniforms.uSpotLight1_position.value.setFromMatrixPosition(light.matrixWorld);
                
                // Calculate direction from light to target
                const direction = new Vector3();
                direction.setFromMatrixPosition(light.target.matrixWorld);
                direction.sub(this.uniforms.uSpotLight1_position.value);
                direction.normalize();
                this.uniforms.uSpotLight1_direction.value.copy(direction);
                
                this.uniforms.uSpotLight1_color.value.copy(light.color);
                this.uniforms.uSpotLight1_intensity.value = light.intensity;
                this.uniforms.uSpotLight1_distance.value = light.distance;
                this.uniforms.uSpotLight1_decay.value = light.decay;
                this.uniforms.uSpotLight1_coneCos.value = Math.cos(light.angle);
                this.uniforms.uSpotLight1_penumbraCos.value = Math.cos(light.angle * (1.0 - light.penumbra));
            }
            
            if (spotLights[1]) {
                const light = spotLights[1];
                light.updateWorldMatrix(true, false);
                light.target.updateWorldMatrix(true, false);
                
                this.uniforms.uSpotLight2_position.value.setFromMatrixPosition(light.matrixWorld);
                
                const direction = new Vector3();
                direction.setFromMatrixPosition(light.target.matrixWorld);
                direction.sub(this.uniforms.uSpotLight2_position.value);
                direction.normalize();
                this.uniforms.uSpotLight2_direction.value.copy(direction);
                
                this.uniforms.uSpotLight2_color.value.copy(light.color);
                this.uniforms.uSpotLight2_intensity.value = light.intensity;
                this.uniforms.uSpotLight2_distance.value = light.distance;
                this.uniforms.uSpotLight2_decay.value = light.decay;
                this.uniforms.uSpotLight2_coneCos.value = Math.cos(light.angle);
                this.uniforms.uSpotLight2_penumbraCos.value = Math.cos(light.angle * (1.0 - light.penumbra));
            }
            
            if (spotLights[2]) {
                const light = spotLights[2];
                light.updateWorldMatrix(true, false);
                light.target.updateWorldMatrix(true, false);
                
                this.uniforms.uSpotLight3_position.value.setFromMatrixPosition(light.matrixWorld);
                
                const direction = new Vector3();
                direction.setFromMatrixPosition(light.target.matrixWorld);
                direction.sub(this.uniforms.uSpotLight3_position.value);
                direction.normalize();
                this.uniforms.uSpotLight3_direction.value.copy(direction);
                
                this.uniforms.uSpotLight3_color.value.copy(light.color);
                this.uniforms.uSpotLight3_intensity.value = light.intensity;
                this.uniforms.uSpotLight3_distance.value = light.distance;
                this.uniforms.uSpotLight3_decay.value = light.decay;
                this.uniforms.uSpotLight3_coneCos.value = Math.cos(light.angle);
                this.uniforms.uSpotLight3_penumbraCos.value = Math.cos(light.angle * (1.0 - light.penumbra));
            }

            this._lastLightUpdate = performance.now();
        }
    };

    return material;
}

export { createMaterial }