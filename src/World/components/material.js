import { 
    ShaderMaterial,
    Vector2,
    Vector3,
    Color,
} from 'three';

function createMaterial (texture, lights) {    
    const uniforms = {
        uMap: { value: texture },
        uBorderWidth: { value: 0.05 },
        uBorderIntensity : { value: 1.0 },
        uBorderColor: { value: new Vector3(0.957, 1.0, 0.368) },
        uMousePosition: { value: new Vector2(0, 0) },
        uMouseInfluence: { value: 1.0 },
        uResolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
        uLOD: { value: 1.0 },
        // Spot light uniforms - flattened structure
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

    const vertexShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform sampler2D uMap;
        uniform float uBorderWidth;
        uniform float uBorderIntensity;
        uniform vec3 uBorderColor;
        uniform vec2 uMousePosition;
        uniform float uMouseInfluence;
        uniform vec2 uResolution;

        // Spot light uniforms
        uniform vec3 uSpotLight1_position;
        uniform vec3 uSpotLight1_direction;
        uniform vec3 uSpotLight1_color;
        uniform float uSpotLight1_intensity;
        uniform float uSpotLight1_distance;
        uniform float uSpotLight1_decay;
        uniform float uSpotLight1_coneCos;
        uniform float uSpotLight1_penumbraCos;

        uniform vec3 uSpotLight2_position;
        uniform vec3 uSpotLight2_direction;
        uniform vec3 uSpotLight2_color;
        uniform float uSpotLight2_intensity;
        uniform float uSpotLight2_distance;
        uniform float uSpotLight2_decay;
        uniform float uSpotLight2_coneCos;
        uniform float uSpotLight2_penumbraCos;

        uniform vec3 uSpotLight3_position;
        uniform vec3 uSpotLight3_direction;
        uniform vec3 uSpotLight3_color;
        uniform float uSpotLight3_intensity;
        uniform float uSpotLight3_distance;
        uniform float uSpotLight3_decay;
        uniform float uSpotLight3_coneCos;
        uniform float uSpotLight3_penumbraCos;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        // Signed distance function for rounded rectangle
        float sdRoundedBox(vec2 p, vec2 b, float r) {
            vec2 q = abs(p) - b + r;
            return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
        }

        vec3 calculateSpotLight(
            vec3 lightPos, vec3 lightDir, vec3 lightColor, float intensity,
            float distance, float decay, float coneCos, float penumbraCos,
            vec3 worldPos, vec3 normal
        ) {
            vec3 lightDirection = normalize(lightPos - worldPos);
            float dist = length(lightPos - worldPos);
            
            float attenuation = 1.0;
            if (distance > 0.0) {
                attenuation = pow(clamp(1.0 - dist / distance, 0.0, 1.0), decay);
            }
            
            float theta = dot(lightDirection, normalize(-lightDir));
            float spotEffect = 0.0;
            
            // Fixed penumbra calculation - swap the values since Three.js calculates them backwards
            float innerCone = max(coneCos, penumbraCos);  // Inner (bright) cone
            float outerCone = min(coneCos, penumbraCos);  // Outer (dim) cone
            
            if (theta >= innerCone) {
                // Inside the core cone
                spotEffect = 1.0;
            } else if (theta >= outerCone) {
                // In penumbra zone
                float epsilon = innerCone - outerCone;
                if (epsilon > 0.0) {
                    spotEffect = (theta - outerCone) / epsilon;
                    // Debug: show penumbra in bright red
                    // return vec3(1.0, 0.0, 0.0) * spotEffect;
                }
            }
            
            float NdotL = max(dot(normal, lightDirection), 0.0);
            return lightColor * intensity * NdotL * attenuation * spotEffect * 0.01;
        }

        void main() {
            vec4 texColor = texture2D(uMap, vUv);
            vec3 normal = normalize(vNormal);
            
            // Base ambient lighting
            vec3 lightColor = vec3(0.1);
            
            // Add spot lights
            lightColor += calculateSpotLight(
                uSpotLight1_position, uSpotLight1_direction, uSpotLight1_color, uSpotLight1_intensity,
                uSpotLight1_distance, uSpotLight1_decay, uSpotLight1_coneCos, uSpotLight1_penumbraCos,
                vWorldPosition, normal
            );
            
            lightColor += calculateSpotLight(
                uSpotLight2_position, uSpotLight2_direction, uSpotLight2_color, uSpotLight2_intensity,
                uSpotLight2_distance, uSpotLight2_decay, uSpotLight2_coneCos, uSpotLight2_penumbraCos,
                vWorldPosition, normal
            );
            
            lightColor += calculateSpotLight(
                uSpotLight3_position, uSpotLight3_direction, uSpotLight3_color, uSpotLight3_intensity,
                uSpotLight3_distance, uSpotLight3_decay, uSpotLight3_coneCos, uSpotLight3_penumbraCos,
                vWorldPosition, normal
            );
            
            vec3 litColor = texColor.rgb * lightColor;

            // Border effect
            vec2 p = vUv - 0.5;
            vec2 size = vec2(0.5425, 0.5425);
            float cornerRadius = 0.1;
            float dist = sdRoundedBox(p, size, cornerRadius);
            
            float borderMask = 1.0 - smoothstep(-uBorderWidth, 0.0, dist);
            borderMask *= smoothstep(-uBorderWidth - 0.03, -uBorderWidth, dist);
            
            vec2 screenPos = gl_FragCoord.xy / uResolution;
            float distanceFromMouse = length(screenPos - uMousePosition);
            float mouseInfluenceStrength = 1.0 - smoothstep(0.0, 0.6, distanceFromMouse);
            mouseInfluenceStrength *= uMouseInfluence;
            
            float borderIntensity = borderMask * mouseInfluenceStrength * uBorderIntensity;
            vec3 borderColor = uBorderColor * borderIntensity;
            litColor = mix(litColor, litColor + borderColor, borderMask);
            
            gl_FragColor = vec4(litColor, texColor.a);
        }
    `;

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

    // Add method to update light uniforms
    material.updateLights = function(lightsGroup) {
        if (!lightsGroup || !lightsGroup.children) return;
        
        // Find spot lights (skip ambient light which is first)
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
    };

    return material;
}

export { createMaterial }