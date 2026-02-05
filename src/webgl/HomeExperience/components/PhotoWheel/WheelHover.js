import { MathUtils } from 'three';
import {
    ANIMATION_CONFIG,
    INTERACTION_CONFIG,
} from '../Config.js';

export default class WheelHover {
    constructor(state, experience) {
        this.state = state;
        this.experience = experience;
    }

    updateHoverEffects() {
        const now = performance.now();
        if (this.state.mouseMovedSinceLastCheck && now - this.state.lastHoverCheck > ANIMATION_CONFIG.HOVER_CHECK_INTERVAL) {
            this.state.lastHoverCheck = now;
            this.state.mouseMovedSinceLastCheck = false;

            if (Math.abs(this.state.currentVelocity) > 0.03) {
                if (this.state.isHovering) {
                    document.body.style.cursor = "default";
                    this.state.isHovering = false;
                    this.state.hoveredItem = null;
                }
                return;
            }

            this.state.raycaster.setFromCamera(this.state.mouse, this.experience.camera.instance);

            const visibleMeshes = this.state.allPhotoMeshes.filter(mesh => {
                const distance = this.experience.camera.instance.position.distanceTo(mesh.position);
                return distance < 400;
            });

            const rayIntersects = this.state.raycaster.intersectObjects(visibleMeshes);

            if (!rayIntersects.length) {
                if (this.state.isHovering) {
                    document.body.style.cursor = "default";
                    this.state.isHovering = false;
                    this.state.hoveredItem = null;
                }

                this.resetAllMeshes();
            } else {
                document.body.style.cursor = "pointer";
                this.state.isHovering = true;
                this.state.hoveredItem = rayIntersects[0].object;

                this.applyHoverEffects();
            }
        }
    }

    resetAllMeshes() {
        for (let i = 0; i < this.state.allPhotoMeshes.length; i++) {
            const mesh = this.state.allPhotoMeshes[i];

            mesh.scale.set(
                MathUtils.lerp(mesh.scale.x, 1, ANIMATION_CONFIG.LERP_FACTOR),
                MathUtils.lerp(mesh.scale.y, 1, ANIMATION_CONFIG.LERP_FACTOR),
                MathUtils.lerp(mesh.scale.z, 1, ANIMATION_CONFIG.LERP_FACTOR)
            );

            mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, 0, ANIMATION_CONFIG.LERP_FACTOR);
            mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, 0, ANIMATION_CONFIG.LERP_FACTOR);

            const targetRotationZ = mesh.userData.baseRotationZ || 0;
            const rotationDiff = targetRotationZ - mesh.rotation.z;

            if (Math.abs(rotationDiff) > Math.PI) {
                mesh.rotation.z = targetRotationZ;
            } else {
                mesh.rotation.z = MathUtils.lerp(
                    mesh.rotation.z,
                    targetRotationZ,
                    ANIMATION_CONFIG.LERP_FACTOR
                );
            }

            if (mesh.material.uniforms && mesh.material.uniforms.uMouseInfluence) {
                mesh.material.uniforms.uMouseInfluence.value = MathUtils.lerp(
                    mesh.material.uniforms.uMouseInfluence.value,
                    0.0,
                    ANIMATION_CONFIG.LERP_FACTOR
                );
            }
        }
    }

    applyHoverEffects() {
        for (let i = 0; i < this.state.allPhotoMeshes.length; i++) {
            const mesh = this.state.allPhotoMeshes[i];

            if (mesh != this.state.hoveredItem) {
                mesh.scale.set(
                    MathUtils.lerp(mesh.scale.x, 1, ANIMATION_CONFIG.LERP_FACTOR),
                    MathUtils.lerp(mesh.scale.y, 1, ANIMATION_CONFIG.LERP_FACTOR),
                    MathUtils.lerp(mesh.scale.z, 1, ANIMATION_CONFIG.LERP_FACTOR)
                );

                if (mesh.material.uniforms && mesh.material.uniforms.uMouseInfluence) {
                    mesh.material.uniforms.uMouseInfluence.value = MathUtils.lerp(
                        mesh.material.uniforms.uMouseInfluence.value,
                        0.0,
                        ANIMATION_CONFIG.LERP_FACTOR
                    );
                }
            }

            mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, 0, ANIMATION_CONFIG.LERP_FACTOR);
            mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, 0, ANIMATION_CONFIG.LERP_FACTOR);

            const targetRotationZ = mesh.userData.baseRotationZ || 0;
            const rotationDiff = targetRotationZ - mesh.rotation.z;

            if (Math.abs(rotationDiff) > Math.PI) {
                mesh.rotation.z = targetRotationZ;
            } else {
                mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, targetRotationZ, ANIMATION_CONFIG.LERP_FACTOR);
            }
        }

        this.state.hoveredItem.scale.set(
            MathUtils.lerp(this.state.hoveredItem.scale.x, INTERACTION_CONFIG.HOVER_SCALE, ANIMATION_CONFIG.LERP_FACTOR * 1.25),
            MathUtils.lerp(this.state.hoveredItem.scale.y, INTERACTION_CONFIG.HOVER_SCALE, ANIMATION_CONFIG.LERP_FACTOR * 1.25),
            MathUtils.lerp(this.state.hoveredItem.scale.z, INTERACTION_CONFIG.HOVER_SCALE, ANIMATION_CONFIG.LERP_FACTOR * 1.25)
        );

        this.state.hoveredItem.getWorldPosition(this.state.tiltVector);
        this.state.tiltVector.project(this.experience.camera.instance);

        const screenX = this.state.tiltVector.x;
        const screenY = this.state.tiltVector.y;

        const offsetX = this.state.mouse.x - screenX;
        const offsetY = this.state.mouse.y - screenY;

        const normalizedX = MathUtils.clamp(offsetX / INTERACTION_CONFIG.PHOTO_SCREEN_SIZE, -1, 1);
        const normalizedY = MathUtils.clamp(offsetY / INTERACTION_CONFIG.PHOTO_SCREEN_SIZE, -1, 1);

        const tiltX = normalizedY * INTERACTION_CONFIG.MAX_TILT;
        const tiltY = normalizedX * INTERACTION_CONFIG.MAX_TILT;

        this.state.hoveredItem.rotation.x = MathUtils.lerp(this.state.hoveredItem.rotation.x, tiltX, ANIMATION_CONFIG.LERP_FACTOR);
        this.state.hoveredItem.rotation.y = MathUtils.lerp(this.state.hoveredItem.rotation.y, tiltY, ANIMATION_CONFIG.LERP_FACTOR);

        if (this.state.hoveredItem.material.uniforms) {
            const mouseScreenX = (this.state.mouse.x + 1) * 0.5;
            const mouseScreenY = (this.state.mouse.y + 1) * 0.5;

            this.state.hoveredItem.material.uniforms.uMousePosition.value.set(mouseScreenX, mouseScreenY);
            this.state.hoveredItem.material.uniforms.uMouseInfluence.value = MathUtils.lerp(
                this.state.hoveredItem.material.uniforms.uMouseInfluence.value,
                1.0,
                ANIMATION_CONFIG.LERP_FACTOR
            );
        }

        const targetZ = this.state.hoveredItem.userData.baseRotationZ || 0;
        const zDiff = targetZ - this.state.hoveredItem.rotation.z;

        if (Math.abs(zDiff) > Math.PI) {
            this.state.hoveredItem.rotation.z = targetZ;
        } else if (Math.abs(zDiff) > 0.05) {
            this.state.hoveredItem.rotation.z = MathUtils.lerp(
                this.state.hoveredItem.rotation.z,
                targetZ,
                ANIMATION_CONFIG.LERP_FACTOR * 0.5
            );
        }
    }

    updateShaderMaterials() {
        const visibleMaterials = this.state.materials.filter((_, i) =>
            this.state.allPhotoMeshes[i].visible
        );

        for (let i = 0; i < visibleMaterials.length; i++) {
            if (visibleMaterials[i].updateLights) {
                visibleMaterials[i].updateLights(this.experience.lights.group);
            }
        }

        for (let i = 0; i < this.state.allPhotoMeshes.length; i++) {
            const mesh = this.state.allPhotoMeshes[i];

            const distanceToCamera = this.experience.camera.instance.position.distanceTo(mesh.position);
            if (distanceToCamera > 200) {
                mesh.material.uniforms.uLOD.value = 0.5;
            } else {
                mesh.material.uniforms.uLOD.value = 1.0;
            }
        }
    }
}