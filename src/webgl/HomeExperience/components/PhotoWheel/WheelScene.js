import { Group } from 'three';
import { createTexture } from './texture.js';
import { createMaterial } from './material.js';
import { createGeometry } from './geometry.js';
import { createMesh } from './mesh.js';
import {
    GEOMETRY_CONFIG,
    PHOTOS_DATA,
    WHEEL_CONFIG,
} from '../Config.js';

export default class WheelScene {
    constructor(state, experience) {
        this.state = state;
        this.experience = experience;
    }

    initialize() {
        this.createGeometry();
        this.createPhotoMeshes();
        this.positionWheels();
        this.saveOriginalMeshPositions();
        return this.createWheelGroup();
    }

    createGeometry() {
        this.state.roundedRectangleGeometry = createGeometry(
            GEOMETRY_CONFIG.SIZE,
            GEOMETRY_CONFIG.SIZE,
            GEOMETRY_CONFIG.CORNER_RADIUS,
            GEOMETRY_CONFIG.CORNER_SMOOTHNESS
        );
    }

    createPhotoMeshes() {
        for (let i = 0; i < PHOTOS_DATA.length; i++) {
            const texture = createTexture(this.state.textureLoader, PHOTOS_DATA[i].imagePath);
            this.state.texturesToDispose.push(texture);

            const material = createMaterial(texture, this.experience.lights);
            this.state.materials.push(material);
            this.state.materialsToDispose.push(material);

            const photoMeshTop = createMesh(this.state.roundedRectangleGeometry, this.state.materials[i], PHOTOS_DATA[i], i);
            const photoMeshBottom = createMesh(this.state.roundedRectangleGeometry, this.state.materials[i], PHOTOS_DATA[i], i);

            this.state.allPhotoMeshes.push(photoMeshTop, photoMeshBottom);
            this.state.topWheel.add(photoMeshTop);
            this.state.bottomWheel.add(photoMeshBottom);
        }
    }

    positionWheels() {
        this.state.topWheel.translateY(
            WHEEL_CONFIG.POSITION + WHEEL_CONFIG.POSITION_OFFSET
        );
        this.state.bottomWheel.translateY(
            -WHEEL_CONFIG.POSITION + WHEEL_CONFIG.POSITION_OFFSET
        );
    }

    saveOriginalMeshPositions() {
        for (let i = 0; i < this.state.allPhotoMeshes.length; i++) {
            const mesh = this.state.allPhotoMeshes[i];
            mesh.userData.originalPosition = mesh.position.clone();
        }

        this.state.topWheel.userData.originalRotation = this.state.topWheel.rotation.clone();
        this.state.bottomWheel.userData.originalRotation = this.state.bottomWheel.rotation.clone();
    }

    createWheelGroup() {
        const instance = new Group();
        instance.add(this.state.topWheel, this.state.bottomWheel);
        return instance;
    }
}