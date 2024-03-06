import { World } from './World/World.js';

async function main() {
    const container = document.querySelector('#scene-container');
    const photoGallery = new World(container);
    photoGallery.start();
}

main();