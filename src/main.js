import { World } from "./World/World";

async function main() {
    const container = document.querySelector('#scene-container');

    if (!container) {
        return;
    }

    const photoWheel = new World(container);
    photoWheel.start();
}

main();