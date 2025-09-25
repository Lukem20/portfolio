import { 
    AmbientLight,
    SpotLight,
    Object3D,
    Group,
    // SpotLightHelper
} from 'three';

function createLights(scene) {
    const aLight = new AmbientLight(0xffffff, 0.1);
    aLight.tick = () => {};

    const spotLight1 = createSpotlight( 0xFAFAFA, 240, scene );
    const spotLight2 = createSpotlight( 0x36EEF5, 120, scene );
    const spotLight3 = createSpotlight( 0xFF5F37, 0, scene );

    const lights = new Group();
    lights.add( aLight, spotLight1, spotLight2, spotLight3 );
    lights.position.y -= 90;

    return lights;
}

function createSpotlight(color, angleOffset, scene) {
    const light = new SpotLight(color, 80);
    light.castShadow = true;
    light.angle = 0.2;
    light.penumbra = 0.125;
    light.decay = 0.6;
    light.distance = 500;

    const radius = 100;
    const angleRad = (angleOffset * Math.PI) / 180;
    const behindZ = 250;

    light.position.set(
        (Math.cos(angleRad) * radius),// + 30,
        (Math.sin(angleRad) * radius),// + 250,
        behindZ
    );

    const target = new Object3D();    
    target.position.set(
        0,
        0,
        0
    );

    light.target = target;
    scene.add(target);

    const movement = {
        angleX: Math.random() * Math.PI * 2,     // Random starting angle for X
        angleY: Math.random() * Math.PI * 2,     // Random starting angle for Y
        speedX: 0.006 + Math.random() * 0.004,   // Random speed X (0.008-0.012)
        speedY: 0.004 + Math.random() * 0.006,   // Random speed Y (0.006-0.012)
        radiusX: 10 + Math.random() * 15,        // Random X radius (10-25)
        radiusY: 5 + Math.random() * 10,        // Random Y radius (10-25)
        centerOffsetX: (Math.random() - 0.5) * 20, // Random center offset
        centerOffsetY: (Math.random() - 0.5) * 20
    }; 

    // const helper = new SpotLightHelper(light);
    // scene.add(helper);

    light.tick = () => {
        movement.angleX += movement.speedX;
        movement.angleY += movement.speedY;

        const x = movement.centerOffsetX + Math.cos(movement.angleX) * movement.radiusX;
        const y = movement.centerOffsetY + Math.sin(movement.angleY) * movement.radiusY;

        target.position.set(x, y, 0);
        // helper.update();
    };

    return light;
}

export { createLights };