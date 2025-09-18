import { 
    AmbientLight,
    SpotLight,
    Object3D,
    Group
} from 'three';

function createLights(scene) {
    const aLight = new AmbientLight(0xffffff, 0.1);
    aLight.tick = () => {};

    const spotLight1 = createSpotlight( 0xBFBFBF, 0, scene );
    const spotLight2 = createSpotlight( 0xBFBFBF, 120, scene );
    const spotLight3 = createSpotlight( 0xBFBFBF, 240, scene );

    const lights = new Group();
    lights.add( aLight, spotLight1, spotLight2, spotLight3 );
    lights.position.y -= 90;

    return lights;
}

function createSpotlight(color, angleOffset, scene) {
    const light = new SpotLight(color, 80);
    light.castShadow = true;
    light.angle = 0.5;
    light.penumbra = 0.9;
    light.decay = 0.6;
    light.distance = 500;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500;
    light.shadow.camera.fov = 60;

    const radius = 100;
    const angleRad = (angleOffset * Math.PI) / 180;
    const behindZ = 250;

    light.position.set(
        (Math.cos(angleRad) * radius),// + 30,
        (Math.sin(angleRad) * radius),// + 250,
        behindZ
    );

    const target = new Object3D();    
    const targetOffset = 50;
    target.position.set(
        (Math.random() - 0.5) * targetOffset,
        (Math.random() - 0.5) * targetOffset,
        0
    );

    light.target = target;
    scene.add(target);

    let angle = 0;
    const movementRadius = targetOffset / 2;
    const rotationSpeed = 0.01; 

    light.tick = () => {
        angle += rotationSpeed;

        const x = movementRadius * Math.cos(angle);
        const y = movementRadius * Math.sin(angle);

        target.position.set(x, y, 0);
    };

    return light;
}

export { createLights };