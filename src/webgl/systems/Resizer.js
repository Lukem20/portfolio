const setSize = (container, camera, renderer) => {
    const sizes = {
        width: container.clientWidth,
        height: container.clientHeight,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
    }
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(sizes.pixelRatio);
};

class Resizer {
    constructor(container, camera, renderer) {
        setSize(container, camera, renderer);

        // Set the size again if a resize occurs
        window.addEventListener("resize", () => {
            setSize(container, camera, renderer);
        });
    }
}

export { Resizer };