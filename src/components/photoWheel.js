import { World } from './World/World.js';

async function main() {
    const photoWheelContainer = document.querySelector('#scene-container');
    const photoWheel = new World(photoWheelContainer);
    photoWheel.start();
}

main();