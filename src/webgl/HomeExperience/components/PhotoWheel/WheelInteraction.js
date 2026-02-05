import {
    INTERACTION_CONFIG,
    SCROLL_CONFIG,
    ANIMATION_CONFIG,
} from '../Config.js';

export default class WheelInteraction {
    constructor(state, experience, animation) {
        this.state = state;
        this.experience = experience;
        this.animation = animation;
    }

    setupEventListeners() {
        this.experience.container.addEventListener('mousemove', this.handleMouseMove);
        this.experience.container.addEventListener('click', this.handleMouseClick);
        this.experience.container.addEventListener('mousedown', this.handleMouseDown);

        document.addEventListener('wheel', this.handleWheelEvent);
        document.addEventListener('touchstart', this.handleTouchStart, false);
        document.addEventListener('touchmove', this.handleTouchMove);
        document.addEventListener('touchend', this.handleTouchEnd);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        document.addEventListener('pageshow', this.handlePageShow);
        document.addEventListener('pagehide', this.handlePageHide);
    }

    handleMouseMove = (event) => {
        const now = performance.now();
        if (now - this.state.lastMouseMoveTime < 16) return;

        this.state.lastMouseMoveTime = now;
        this.state.mouseMovedSinceLastCheck = true;

        this.state.mouse.x = event.clientX / window.innerWidth * 2 - 1;
        this.state.mouse.y = -(event.clientY / window.innerHeight * 2 - 1);

        if (this.state.isDragging) {
            this.handleMouseDrag(event);
        }
    }

    handleMouseDrag = (event) => {
        const now = performance.now();
        const deltaTime = now - this.state.lastDragTime;

        this.state.dragCurrentPosition.x = event.clientX;
        this.state.dragCurrentPosition.y = event.clientY;

        const deltaX = this.state.dragCurrentPosition.x - this.state.dragStartPosition.x;
        const sensitivity = 4000;
        let angleDiff = (deltaX / sensitivity) * Math.PI * 2;

        this.state.dragStartPosition.x = this.state.dragCurrentPosition.x;
        this.state.dragStartPosition.y = this.state.dragCurrentPosition.y;

        if (Math.abs(angleDiff) > 0.001) {
            this.state.dragDidMove = true;

            const maxDragSpeed = 0.075;
            angleDiff = Math.max(-maxDragSpeed, Math.min(maxDragSpeed, angleDiff));

            this.animation.rotateWheels(angleDiff);

            if (deltaTime > 0) {
                const angularVelocity = angleDiff / (deltaTime * 1000);
                this.state.dragVelocityHistory.push({
                    velocity: angularVelocity,
                    time: now,
                });

                if (this.state.dragVelocityHistory.length > INTERACTION_CONFIG.VELOCITY_HISTORY_LENGTH) {
                    this.state.dragVelocityHistory.shift();
                }
            }
        }

        this.state.lastDragTime = now;
        event.preventDefault();
    }

    handleMouseClick = () => {
        if (this.state.dragDidMove) {
            this.state.dragDidMove = false;
            return;
        }

        if (this.state.isHovering && Math.abs(this.state.currentVelocity) < INTERACTION_CONFIG.VELOCITY_CLICK_THRESHOLD) {
            if (this.state.isSnapping) {
                setTimeout(() => {
                    if (this.state.isHovering) {
                        this.executeClick();
                    }
                }, 100);
            } else {
                this.executeClick();
            }
        }
    }

    handleMouseDown = (event) => {
        if (this.state.isConverging) return;

        this.animation.stopSnapAnimation();
        this.animation.stopStepRotation();

        this.state.isDragging = true;
        this.state.dragDidMove = false;

        this.state.dragStartPosition.x = event.clientX;
        this.state.dragStartPosition.y = event.clientY;

        this.state.dragCurrentPosition.x = event.clientX;
        this.state.dragCurrentPosition.y = event.clientY;

        this.state.dragVelocityHistory.length = 0;
        this.state.lastDragTime = performance.now();

        document.body.style.cursor = "grabbing";
        event.preventDefault();
    }

    handleWheelEvent = (event) => {
        if (this.state.isConverging) return;

        this.state.isSnapping = false;
        clearTimeout(this.state.spinTimeout);

        if (this.state.isHovering) {
            this.resetHoverScale();
        }

        const scroll = event.deltaY;
        const scrollIntensity = Math.abs(scroll) / SCROLL_CONFIG.INTENSITY_DIVISOR;
        let velocityChange = Math.min(
            scrollIntensity * SCROLL_CONFIG.BASE_VELOCITY_CHANGE,
            SCROLL_CONFIG.MAX_VELOCITY_CHANGE
        );

        if (Math.abs(scroll) < SCROLL_CONFIG.TRACKPAD_THRESHOLD) {
            velocityChange *= SCROLL_CONFIG.TRACKPAD_MULTIPLIER;

            clearTimeout(this.state.spinTimeout);
            this.state.spinTimeout = setTimeout(() => {
                this.animation.startSnapAnimation();
                setTimeout(() => this.forceHoverCheck(), SCROLL_CONFIG.TRACKPAD_THRESHOLD);
            }, SCROLL_CONFIG.TRACKPAD_SNAP_DELAY);
        } else {
            clearTimeout(this.state.spinTimeout);

            this.state.spinTimeout = setTimeout(() => {
                this.animation.startSnapAnimation();
                setTimeout(() => this.forceHoverCheck(), 50);
            }, SCROLL_CONFIG.MOUSE_WHEEL_SNAP_DELAY);
        }

        if (scroll > 0) {
            this.state.targetVelocity -= velocityChange;
        } else {
            this.state.targetVelocity += velocityChange;
        }

        this.state.targetVelocity = this.clampVelocity(this.state.targetVelocity);
    }

    handleTouchStart = (event) => {
        if (this.state.isConverging) return;

        this.state.isSnapping = false;
        clearTimeout(this.state.spinTimeout);

        const firstTouch = event.touches[0];
        this.state.xDown = firstTouch.clientX;
        this.state.yDown = firstTouch.clientY;
    }

    handleTouchMove = (event) => {
        if (!this.state.xDown || !this.state.yDown) return;

        let xUp = event.touches[0].clientX;
        let yUp = event.touches[0].clientY;
        let xDiff = this.state.xDown - xUp;
        let yDiff = this.state.yDown - yUp;

        let swipeSpeed = Math.sqrt((Math.pow(xDiff, 2) + Math.pow(yDiff, 2))) / SCROLL_CONFIG.SWIPE_DIVISOR;
        swipeSpeed = Math.min(swipeSpeed, SCROLL_CONFIG.MAX_SWIPE_SPEED);

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            this.state.targetVelocity = xDiff > 0 ? -swipeSpeed : swipeSpeed;
        } else {
            this.state.targetVelocity = yDiff > 0 ? swipeSpeed : -swipeSpeed;
        }

        this.state.targetVelocity = this.clampVelocity(this.state.targetVelocity);

        this.state.xDown = xUp;
        this.state.yDown = yUp;

        clearTimeout(this.state.spinTimeout);
        this.state.spinTimeout = setTimeout(() => {
            this.animation.startSnapAnimation();
        }, SCROLL_CONFIG.SWIPE_SNAP_DELAY);
    }

    handleTouchEnd = () => {
        this.state.xDown = null;
        this.state.yDown = null;
    }

    handleMouseUp = (event) => {
        this.state.isDragging = false;
        document.body.style.cursor = 'default';

        const now = performance.now();
        let releaseVelocity = 0;

        if (this.state.dragVelocityHistory.length > 0) {
            const recentSamples = this.state.dragVelocityHistory.filter(sample =>
                now - sample.time < 100
            );

            if (recentSamples.length > 0) {
                const avgVelocity = recentSamples.reduce((sum, sample) =>
                    sum + sample.velocity, 0
                ) / recentSamples.length;

                releaseVelocity = avgVelocity;
            }

            releaseVelocity = this.clampVelocity(releaseVelocity);
        }

        if (Math.abs(releaseVelocity) > 0.005) {
            this.state.targetVelocity = releaseVelocity;

            clearTimeout(this.state.spinTimeout);
            this.state.spinTimeout = setTimeout(() => {
                this.animation.startSnapAnimation();
                setTimeout(() => this.forceHoverCheck(), 50);
            }, 800);
        } else {
            setTimeout(() => {
                this.animation.startSnapAnimation();
                setTimeout(() => this.forceHoverCheck(), 50);
            }, 100);
        }

        this.state.dragVelocityHistory.length = 0;
        event.preventDefault();
    }

    handleKeyDown = (event) => {
        if (this.state.isConverging) return;

        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(event.code)) {
            return;
        }

        event.preventDefault();

        if (event.code === 'Enter') {
            this.handleEnterKey();
            return;
        }

        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            if (!this.state.pressedKeys.has(event.code)) {
                this.state.pressedKeys.add(event.code);
                this.state.isKeyPressed = true;

                this.animation.stopSnapAnimation();
                this.animation.stopStepRotation();

                if (this.state.isHovering) {
                    this.resetHoverScale();
                }
            }
        }

        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            if (!this.state.pressedKeys.has(event.code)) {
                this.state.pressedKeys.add(event.code);

                this.animation.stopSnapAnimation();

                this.state.isStepRotating = true;
                this.state.stepRotationProgress = 0;
                this.state.stepRotationVelocity = 0;

                const baseRotation = ANIMATION_CONFIG.RADIAN_INTERVAL || (Math.PI * 2) / 8;
                const totalRotation = baseRotation + SCROLL_CONFIG.KEY_STEP_ROTATION_EXTRA;

                if (event.code === 'ArrowLeft') {
                    this.state.stepRotationTarget = totalRotation;
                } else {
                    this.state.stepRotationTarget = -totalRotation;
                }
            }
        }
    }

    handleKeyUp = (event) => {
        if (event.code === 'Enter') return;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
            event.preventDefault();
        }

        this.state.pressedKeys.delete(event.code);

        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            if (!this.state.pressedKeys.has('ArrowUp') && !this.state.pressedKeys.has('ArrowDown')) {
                this.state.isKeyPressed = false;

                setTimeout(() => {
                    this.animation.startSnapAnimation();
                    setTimeout(() => this.forceHoverCheck(), 50);
                }, 100);
            }
        }
    }

    handleEnterKey = () => {
        if (this.state.isConverging || this.state.isSnapping || this.state.isStepRotating || this.state.isKeyPressed) {
            return;
        }

        if (Math.abs(this.state.currentVelocity) > ANIMATION_CONFIG.VELOCITY_THRESHOLD ||
            Math.abs(this.state.targetVelocity) > ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
            return;
        }

        const snapData = this.animation.calculateSnapAngle(this.state.topWheel);

        if (!snapData.closestMesh || Math.abs(snapData.angle) > 0.05) {
            return;
        }

        this.animation.startConvergeAnimation(snapData.closestMesh);
    }

    handleVisibilityChange = () => {
        if (document.hidden && this.state.isConverging) {
            this.animation.endConvergeAnimation();
        }

        this.resetAllMeshToOriginalState();
    }

    handlePageShow = (event) => {
        if (event.persisted) {
            this.animation.endConvergeAnimation();

            this.state.isSnapping = false;
            this.state.targetVelocity = 0;
            this.state.currentVelocity = 0;
            this.state.convergeProgress = 0;

            if (this.state.topWheel.userData.originalRotation) {
                this.state.topWheel.rotation.copy(this.state.topWheel.userData.originalRotation);
            }
            if (this.state.bottomWheel.userData.originalRotation) {
                this.state.bottomWheel.rotation.copy(this.state.bottomWheel.userData.originalRotation);
            }

            this.resetAllMeshToOriginalState();

            if (this.experience.renderer) {
                this.experience.renderer.render(this.experience.scene, this.experience.camera.instance);
            }
        } else {
            window.location.reload();
        }
    }

    handlePageHide = () => {
        if (this.state.isConverging) {
            this.animation.endConvergeAnimation();
        }
        clearTimeout(this.state.spinTimeout);

        setTimeout(() => {
            if (document.hidden) {
                this.disposeResources();
            }
        }, 30000);
    }

    handleContextLoss = (event) => {
        event.preventDefault();
        this.state.isContextLost = true;

        if (this.state.isConverging) {
            this.animation.endConvergeAnimation();
        }

        this.animation.stopSnapAnimation();
    }

    handleContextRestored = () => {
        this.state.isContextLost = false;
    }

    resetHoverScale() {
        for (let i = 0; i < this.state.allPhotoMeshes.length; i++) {
            this.state.allPhotoMeshes[i].scale.set(1, 1, 1);
        }
    }

    clampVelocity(velocity) {
        return Math.max(-ANIMATION_CONFIG.MAX_VELOCITY, Math.min(ANIMATION_CONFIG.MAX_VELOCITY, velocity));
    }

    executeClick() {
        if (!this.state.isConverging) {
            this.animation.startConvergeAnimation(this.state.hoveredItem);
        } else {
            window.location.href = this.state.hoveredItem.name.projectPath;
        }
    }

    resetAllMeshToOriginalState() {
        for (let i = 0; i < this.state.allPhotoMeshes.length; i++) {
            this.resetMeshState(this.state.allPhotoMeshes[i]);
        }
    }

    resetMeshState(mesh) {
        if (mesh.userData.originalPosition) {
            mesh.position.copy(mesh.userData.originalPosition);
        }

        mesh.scale.set(1, 1, 1);
        mesh.rotation.x = 0;
        mesh.rotation.y = 0;

        if (mesh.userData.originalBaseRotationZ !== undefined) {
            mesh.rotation.z = mesh.userData.originalBaseRotationZ;
            mesh.userData.baseRotationZ = mesh.userData.originalBaseRotationZ;
        } else {
            mesh.rotation.z = 0;
            mesh.userData.baseRotationZ = 0;
        }

        this.resetMeshUserData(mesh);
    }

    resetMeshUserData(mesh) {
        delete mesh.userData.isTarget;
        delete mesh.userData.cachedTarget;
        delete mesh.userData.startAngle;
        delete mesh.userData.angleDiff;
        delete mesh.userData.radius;
        delete mesh.userData.startZ;
        delete mesh.userData.targetZ;
        delete mesh.userData.zDiff;
        delete mesh.userData.startPosition;
    }

    forceHoverCheck() {
        if (this.state.isConverging) return;

        this.state.raycaster.setFromCamera(this.state.mouse, this.experience.camera.instance);
        const rayIntersects = this.state.raycaster.intersectObjects(this.state.allPhotoMeshes);

        if (!rayIntersects.length) {
            if (this.state.isHovering) {
                document.body.style.cursor = "default";
                this.state.isHovering = false;
                this.state.hoveredItem = null;
            }
        } else {
            document.body.style.cursor = "pointer";
            this.state.isHovering = true;
            this.state.hoveredItem = rayIntersects[0].object;
        }
    }

    cleanupEventListeners() {
        document.removeEventListener('wheel', this.handleWheelEvent);
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('mouseup', this.handleMouseUp);
        this.experience.container.removeEventListener('mousemove', this.handleMouseMove);
        this.experience.container.removeEventListener('click', this.handleMouseClick);
        this.experience.container.removeEventListener('mousedown', this.handleMouseDown);

        this.disposeResources();

        if (this.experience.container.querySelector('canvas')) {
            const canvas = this.experience.container.querySelector('canvas');
            canvas.removeEventListener('webglcontextlost', this.handleContextLoss);
            canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
        }
    }

    disposeResources() {
        if (this.state.roundedRectangleGeometry) {
            this.state.roundedRectangleGeometry.dispose();
        }

        this.state.materialsToDispose.forEach(material => {
            if (material) material.dispose();
        });
        this.state.materialsToDispose.length = 0;
        this.state.materials.length = 0;

        this.state.texturesToDispose.forEach(texture => {
            if (texture) texture.dispose();
        });
        this.state.texturesToDispose.length = 0;

        this.state.allPhotoMeshes.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
        });
        this.state.allPhotoMeshes.length = 0;

        this.experience.renderer.dispose();
    }
}