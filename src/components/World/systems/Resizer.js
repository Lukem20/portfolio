const setSize = (container, camera, renderer) => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

class Resizer {
    constructor(container, camera, renderer) {
        setSize(container, camera, renderer);

        // Set the size again if a resize occurs
        window.addEventListener("resize", () => {
            setSize(container, camera, renderer);
        });

        // Allow user to enter and exit fullscreen
        window.addEventListener('dblclick', () => {
            const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
            if (!fullscreenElement) {
                if(container.requestFullscreen) {
                    container.requestFullscreen();
                }
                else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        });
    }
}

export { Resizer };