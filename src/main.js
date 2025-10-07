"use strict";
import { World } from "./World/World";

async function main() {
    const container = document.querySelector('#scene-container');

    if (!container) {
        return;
    }

    const world = new World(container);
    world.start();

    window.addEventListener('beforeunload', () => {
        if (world) {
            world.dispose();
        }
    });

    document.addEventListener('pagehide', () => {
        if (world) {
            world.dispose();
        }
    });
}

main();