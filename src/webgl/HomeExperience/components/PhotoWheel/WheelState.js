import {
    Group,
    Raycaster,
    TextureLoader,
    Vector2,
    Vector3,
} from 'three';
import {
    ANIMATION_CONFIG,
} from '../Config.js';

export default class WheelState {
    constructor() {
        this.initializeSceneObjects();
        this.initializeScrollState();
        this.initializeTouchState();
        this.initializeMouseState();
        this.initializeDragState();
        this.initializeHoverState();
        this.initializeKeyboardState();
        this.initializeSnappingState();
        this.initializeConvergeState();
        this.initializeContextState();
    }

    initializeSceneObjects() {
        this.textureLoader = new TextureLoader();
        this.materials = [];
        this.texturesToDispose = [];
        this.materialsToDispose = [];
        this.allPhotoMeshes = [];
        this.topWheel = new Group();
        this.bottomWheel = new Group();
        this.roundedRectangleGeometry = null;
    }

    initializeScrollState() {
        this.targetVelocity = 0;
        this.currentVelocity = 0;
        this.spinTimeout = null;
    }

    initializeTouchState() {
        this.xDown = null;
        this.yDown = null;
    }

    initializeMouseState() {
        this.mouse = new Vector2();
        this.mouseMovedSinceLastCheck = false;
        this.lastHoverCheck = 0;
        this.lastMouseMoveTime = 0;
        this.tiltVector = new Vector3();
    }

    initializeDragState() {
        this.isDragging = false;
        this.dragDidMove = false;
        this.dragStartPosition = new Vector2();
        this.dragCurrentPosition = new Vector2();
        this.dragVelocityHistory = [];
        this.lastDragTime = 0;
    }

    initializeHoverState() {
        this.isHovering = false;
        this.hoveredItem = null;
        this.raycaster = new Raycaster();
    }

    initializeKeyboardState() {
        this.isKeyPressed = false;
        this.pressedKeys = new Set();
        this.isStepRotating = false;
        this.stepRotationTarget = 0;
        this.stepRotationProgress = 0;
        this.stepRotationVelocity = 0;
    }

    initializeSnappingState() {
        this.isSnapping = false;
        this.snapStartRotation = 0;
        this.snapTargetRotation = 0;
        this.snapProgress = 0;
        this.springVelocity = 0;
        this.springDamping = ANIMATION_CONFIG.INITIAL_SPRING_DAMPING;
        this.springStiffness = ANIMATION_CONFIG.INITIAL_SPRING_STIFFNESS;
        this.tempVector = new Vector3();
        this.snapPoint = { x: 0, y: 0, theta: 0 };
    }

    initializeConvergeState() {
        this.isConverging = false;
        this.convergeProgress = 0;
    }

    initializeContextState() {
        this.isContextLost = false;
    }
}