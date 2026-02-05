import { Vector3, MathUtils } from 'three';
import {
    WHEEL_CONFIG,
    ANIMATION_CONFIG,
    SCROLL_CONFIG,
} from '../Config.js';

export default class WheelAnimation {
    constructor(state, experience) {
        this.state = state;
        this.experience = experience;
    }

    rotateWheels(angle) {
        if (this.state.isConverging) return;

        this.state.topWheel.rotateZ(angle);
        this.state.bottomWheel.rotateZ(angle);

        for (let i = 0; i < this.state.allPhotoMeshes.length; i++) {
            const mesh = this.state.allPhotoMeshes[i];

            if (!mesh.userData.baseRotationZ) {
                mesh.userData.baseRotationZ = 0;
            }

            mesh.rotateZ(-angle);
            mesh.userData.baseRotationZ = mesh.rotation.z;
        }
    }

    calculateSnapAngle(wheel) {
        const snapPoint = {
            x: wheel.children[4].position.x,
            y: wheel.children[4].position.y,
            theta: 0
        };

        snapPoint.theta = Math.atan2(
            Math.abs(snapPoint.y - wheel.position.y),
            Math.abs(snapPoint.x - wheel.position.x)
        );

        let closestMesh = null;
        let closestX = 0.0;
        let closestY = 0.0;
        let shortestDistance = Infinity;

        const tempVector = new Vector3();

        for (let i = 0; i < this.state.topWheel.children.length; i++) {
            const element = this.state.topWheel.children[i];
            tempVector.setFromMatrixPosition(element.matrixWorld);

            let dx = tempVector.x - snapPoint.x;
            let dy = tempVector.y - snapPoint.y;
            let currentDistance = dx * dx + dy * dy;

            if (currentDistance < shortestDistance) {
                shortestDistance = currentDistance;
                closestX = tempVector.x;
                closestY = tempVector.y;
                closestMesh = element;
            }
        }

        let angleOfClosestMesh = Math.atan2(
            Math.abs(closestY - wheel.position.y),
            Math.abs(closestX - wheel.position.x)
        );
        let snapAngle = Math.abs(angleOfClosestMesh - snapPoint.theta);

        if (closestX > wheel.position.x && closestY <= wheel.position.y) {
            snapAngle = angleOfClosestMesh > snapPoint.theta ? snapAngle : -1.0 * snapAngle;
        } else if (closestX <= wheel.position.x && closestY <= wheel.position.y) {
            snapAngle = angleOfClosestMesh > snapPoint.theta ? -1.0 * snapAngle : snapAngle;
        } else if (closestX <= wheel.position.x && closestY > wheel.position.y) {
            snapAngle = angleOfClosestMesh > snapPoint.theta ? snapAngle : -1.0 * snapAngle;
        } else if (closestX > wheel.position.x && closestY >= wheel.position.y) {
            snapAngle = angleOfClosestMesh > snapPoint.theta ? -1.0 * snapAngle : snapAngle;
        }

        return { angle: snapAngle, closestMesh: closestMesh };
    }

    startSnapAnimation() {
        if (this.state.isConverging) return;

        const snapData = this.calculateSnapAngle(this.state.topWheel);

        if (Math.abs(snapData.angle) < 0.01) return;

        this.state.isSnapping = true;
        this.state.snapStartRotation = 0;
        this.state.snapTargetRotation = snapData.angle;
        this.state.snapProgress = 0;
        this.state.springVelocity = 0;

        const projectTitle = document.getElementById('project-title');
        if (projectTitle && snapData.closestMesh) {
            projectTitle.textContent = `${snapData.closestMesh.name.projectTitle}`;
        }
    }

    stopSnapAnimation() {
        this.state.isSnapping = false;
        this.state.targetVelocity = 0;
        this.state.currentVelocity = 0;
        clearTimeout(this.state.spinTimeout);
    }

    stopStepRotation() {
        this.state.isStepRotating = false;
        this.state.stepRotationTarget = 0;
        this.state.stepRotationProgress = 0;
        this.state.stepRotationVelocity = 0;
    }

    startConvergeAnimation(mesh) {
        this.resetAllMeshUserData();

        this.state.isConverging = true;
        this.state.convergeProgress = 0;

        let clickedInTopWheel = this.state.topWheel.children.includes(mesh);
        let topTarget, bottomTarget;

        if (clickedInTopWheel) {
            topTarget = mesh;
            let clickedIndex = this.state.topWheel.children.indexOf(mesh);
            let totalPhotos = this.state.topWheel.children.length;
            let oppositeIndex = (clickedIndex + Math.floor(totalPhotos / 2)) % totalPhotos;
            bottomTarget = this.state.bottomWheel.children[oppositeIndex];
        } else {
            bottomTarget = mesh;
            let clickedIndex = this.state.bottomWheel.children.indexOf(mesh);
            let totalPhotos = this.state.bottomWheel.children.length;
            let oppositeIndex = (clickedIndex + Math.floor(totalPhotos / 2)) % totalPhotos;
            topTarget = this.state.topWheel.children[oppositeIndex];
        }

        this.stopSnapAnimation();

        for (let i = 0; i < this.state.allPhotoMeshes.length; i++) {
            const photoMesh = this.state.allPhotoMeshes[i];

            if (photoMesh === topTarget || photoMesh === bottomTarget) {
                photoMesh.userData.isTarget = true;
                continue;
            }

            photoMesh.userData.isTarget = false;
            photoMesh.userData.startPosition = photoMesh.position.clone();

            let clickedInTopWheel = this.state.topWheel.children.includes(photoMesh);
            let target = clickedInTopWheel ? topTarget : bottomTarget;
            photoMesh.userData.cachedTarget = target;

            let startAngle = Math.atan2(photoMesh.position.y, photoMesh.position.x);
            let targetAngle = Math.atan2(target.position.y, target.position.x);

            let angleDiff = targetAngle - startAngle;
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            photoMesh.userData.startAngle = startAngle;
            photoMesh.userData.angleDiff = angleDiff;
            photoMesh.userData.radius = WHEEL_CONFIG.RADIUS;
            photoMesh.userData.startZ = photoMesh.userData.startPosition.z;
            photoMesh.userData.targetZ = target.position.z + ANIMATION_CONFIG.STACK_OFFSET;
            photoMesh.userData.zDiff = photoMesh.userData.targetZ - photoMesh.userData.startZ;
        }

        setTimeout(() => {
            if (this.interaction) {
                this.interaction.cleanupEventListeners();
            }
            window.location.href = mesh.name.projectPath;
        }, ANIMATION_CONFIG.CONVERGE_DURATION);
    }

    endConvergeAnimation() {
        if (!this.state.isConverging) return;

        this.state.isConverging = false;
        this.state.convergeProgress = 0;

        if (this.interaction) {
            this.interaction.resetAllMeshToOriginalState();
        }
    }

    resetAllMeshUserData() {
        for (let i = 0; i < this.state.allPhotoMeshes.length; i++) {
            this.resetMeshUserData(this.state.allPhotoMeshes[i]);
        }
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

    updateConvergeAnimation() {
        if (this.state.isConverging) {
            this.state.convergeProgress += ANIMATION_CONFIG.CONVERGE_SPEED;

            if (this.state.convergeProgress >= 1) {
                this.state.convergeProgress = 1;
            }

            const eased = 1 - Math.pow(1 - this.state.convergeProgress, 3);

            for (let i = 0; i < this.state.allPhotoMeshes.length; i++) {
                const photoMesh = this.state.allPhotoMeshes[i];

                if (photoMesh.userData.isTarget) continue;

                const currentAngle = photoMesh.userData.startAngle + (photoMesh.userData.angleDiff * eased);
                const newX = Math.cos(currentAngle) * photoMesh.userData.radius;
                const newY = Math.sin(currentAngle) * photoMesh.userData.radius;
                const newZ = photoMesh.userData.startZ + (photoMesh.userData.zDiff * eased);

                photoMesh.position.set(newX, newY, newZ);
            }
        }
    }

    updateSnapAnimation() {
        if (this.state.isStepRotating) {
            const displacement = this.state.stepRotationTarget - this.state.stepRotationProgress;

            this.state.stepRotationVelocity += displacement * SCROLL_CONFIG.KEY_STEP_ROTATION_SPEED;
            this.state.stepRotationVelocity *= SCROLL_CONFIG.KEY_STEP_ROTATION_DAMPING;
            this.state.stepRotationProgress += this.state.stepRotationVelocity;

            if (Math.abs(displacement) < 0.01 && Math.abs(this.state.stepRotationVelocity) < 0.01) {
                const finalRotation = this.state.stepRotationTarget - this.state.stepRotationProgress;
                this.rotateWheels(finalRotation);

                this.stopStepRotation();

                setTimeout(() => {
                    this.startSnapAnimation();
                    if (this.interaction) {
                        setTimeout(() => this.interaction.forceHoverCheck(), 50);
                    }
                }, 50);
            } else {
                this.rotateWheels(this.state.stepRotationVelocity);
            }
        } else if (this.state.isSnapping) {
            const displacement = this.state.snapTargetRotation - this.state.snapProgress;

            const springForce = displacement * this.state.springStiffness;
            const dampingForce = this.state.springVelocity * this.state.springDamping;

            this.state.springVelocity += springForce - dampingForce;
            this.state.snapProgress += this.state.springVelocity;

            if (Math.abs(displacement) < 0.001 && Math.abs(this.state.springVelocity) < 0.001) {
                this.state.snapProgress = this.state.snapTargetRotation;
                this.state.springVelocity = 0;
                this.state.isSnapping = false;
                this.state.targetVelocity = 0;
                this.state.currentVelocity = 0;

                if (this.interaction) {
                    setTimeout(() => this.interaction.forceHoverCheck(), 0);
                }
            }

            const deltaRotation = this.state.snapProgress - this.state.snapStartRotation;

            this.rotateWheels(deltaRotation);
            this.state.snapStartRotation = this.state.snapProgress;
        }
    }

    updateSpinAnimation() {
        if (this.state.isKeyPressed) {
            let keyDirection = 0;

            if (this.state.pressedKeys.has('ArrowUp')) {
                keyDirection += SCROLL_CONFIG.KEY_SPIN_SPEED;
            }
            if (this.state.pressedKeys.has('ArrowDown')) {
                keyDirection -= SCROLL_CONFIG.KEY_SPIN_SPEED;
            }
            if (keyDirection !== 0) {
                this.state.targetVelocity = this.clampVelocity(keyDirection);
            }
        }

        this.state.currentVelocity = MathUtils.lerp(this.state.currentVelocity, this.state.targetVelocity, 0.1);
        this.state.targetVelocity *= ANIMATION_CONFIG.FRICTION;

        if (Math.abs(this.state.targetVelocity) < ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
            this.state.targetVelocity = 0;
        }
        if (Math.abs(this.state.currentVelocity) < ANIMATION_CONFIG.VELOCITY_THRESHOLD) {
            this.state.currentVelocity = 0;
        }
        if (this.state.currentVelocity !== 0) {
            this.rotateWheels(this.state.currentVelocity);
        }
    }

    clampVelocity(velocity) {
        return Math.max(-ANIMATION_CONFIG.MAX_VELOCITY, Math.min(ANIMATION_CONFIG.MAX_VELOCITY, velocity));
    }
}