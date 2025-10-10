export const fragmentShader = `
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
        float distanceFromMouse = dot(screenPos - uMousePosition, screenPos - uMousePosition);
        float mouseInfluenceStrength = 1.0 - smoothstep(0.0, 0.6, distanceFromMouse);
        mouseInfluenceStrength *= uMouseInfluence;
        
        float borderIntensity = borderMask * mouseInfluenceStrength * uBorderIntensity;
        vec3 borderColor = uBorderColor * borderIntensity;
        litColor = mix(litColor, litColor + borderColor, borderMask);
        
        gl_FragColor = vec4(litColor, texColor.a);
    }
`;