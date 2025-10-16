export const GEOMETRY_CONFIG = {
    SIZE: 43,
    CORNER_RADIUS: 2.5,
    CORNER_SMOOTHNESS: 12,
};

export const PHOTOS_DATA = [
    {
        imagePath: '/assets/haunted-house-square-1.jpg',
        projectPath: '/projects/HauntedHouse.html',
        projectTitle: 'Three.js Haunted House'
    },
    {
        imagePath: '/assets/brand-identity-timeline-square-2.jpg',
        projectPath: '/projects/BrandIdentityTimeline.html',
        projectTitle: 'Brand Identity Timeline'
    },
    {   // Replace image path
        imagePath: '/assets/abts1.jpg',
        projectPath: '/projects/BotanyBlog.html',
        projectTitle: 'Botany Blog'
    },
    {
        imagePath: '/assets/sandbox-square-2.jpg',
        projectPath: '/projects/ThreejsSandbox.html',
        projectTitle: 'Three.js Sandbox Environment'
    },
    {
        imagePath: '/assets/sisis-barbershop-square-1.jpg',
        projectPath: '/projects/SisisBarbershop.html',
        projectTitle: "Sisi's Barbershop"
    },
    {
        imagePath: '/assets/healdsburg-crush-square-1.jpg',
        projectPath: '/projects/HealdsburgCrush.html',
        projectTitle: 'The Healdsburg Crush'
    },
    {
        imagePath: '/assets/seven-deadly-sins-square-1.jpg',
        projectPath: '/projects/SevenDeadlySins.html',
        projectTitle: 'The Seven Deadly Sins'
    },
    {
        imagePath: '/assets/graphics-textbook-square-1.jpg',
        projectPath: '/projects/GraphicsInteractiveTextbook.html',
        projectTitle: 'Interactive Graphics Textbook'
    },
    // bottom wheel
    {
        imagePath: '/assets/haunted-house-square-2.jpg',
        projectPath: '/projects/HauntedHouse.html',
        projectTitle: 'Three.js Haunted House'
    },
    {
        imagePath: '/assets/brand-identity-timeline-square-2.jpg',
        projectPath: '/projects/BrandIdentityTimeline.html',
        projectTitle: 'Brand Identity Timeline'
    },
    {   // Replace image path
        imagePath: '/assets/abts2.jpg',
        projectPath: '/projects/BotanyBlog.html',
        projectTitle: 'Botany Blog'
    },
    {
        imagePath: '/assets/sandbox-square-1.jpg',
        projectPath: '/projects/ThreejsSandbox.html',
        projectTitle: 'Three.js Sandbox Environment'
    },
    {
        imagePath: '/assets/sisis-barbershop-square-2.jpg',
        projectPath: '/projects/SisisBarbershop.html',
        projectTitle: "Sisi's Barbershop"
    },
    {
        imagePath: '/assets/healdsburg-crush-square-2.jpg',
        projectPath: '/projects/HealdsburgCrush.html',
        projectTitle: 'The Healdsburg Crush'
    },
    {
        imagePath: '/assets/seven-deadly-sins-square-2.jpg',
        projectPath: '/projects/SevenDeadlySins.html',
        projectTitle: 'Seven Deadly Sins'
    },
    {
        imagePath: '/assets/graphics-textbook-square-2.jpg',
        projectPath: '/projects/GraphicsInteractiveTextbook.html',
        projectTitle: 'Interactive Graphics Textbook'
    },
];

export const WHEEL_CONFIG = {
    RADIUS: 175,
    POSITION: 208,
    POSITION_OFFSET: -13,
    RADIAN_INTERVAL: (2 * Math.PI) / PHOTOS_DATA.length,

};

export const ANIMATION_CONFIG = {
    FRICTION: 0.87,
    VELOCITY_THRESHOLD: 0.002,
    SNAP_SPEED: 0.02,
    SNAP_ROTATION_EXTRA: 0.075,
    INITIAL_SPRING_STIFFNESS: 0.085,
    INITIAL_SPRING_DAMPING: 0.275,
    MAX_VELOCITY: 0.1,
    HOVER_CHECK_INTERVAL: 32,
    LERP_FACTOR: 0.3,
    CONVERGE_SPEED: 0.025,
    CONVERGE_DURATION: 650,
    STACK_OFFSET: -2.5,
};

export const INTERACTION_CONFIG = {
    HOVER_SCALE: 1.03,
    PHOTO_SCREEN_SIZE: 0.15,
    MAX_TILT: Math.PI / 30,
    VELOCITY_CLICK_THRESHOLD: 0.02,
    VELOCITY_HISTORY_LENGTH: 5,
    RAYCAST_THROTTLE: 50,
    MAX_DRAG_SPEED: 0.05,
};

export const SCROLL_CONFIG = {
    INTENSITY_DIVISOR: 100,
    MAX_VELOCITY_CHANGE: 0.05,
    BASE_VELOCITY_CHANGE: 0.02,
    TRACKPAD_THRESHOLD: 50,
    TRACKPAD_MULTIPLIER: 1.5,
    TRACKPAD_SNAP_DELAY: 100,
    MOUSE_WHEEL_SNAP_DELAY: 500,
    SWIPE_DIVISOR: 300,
    MAX_SWIPE_SPEED: 0.15,
    SWIPE_SNAP_DELAY: 250,
    KEY_SPIN_SPEED: 0.02,
    KEY_STEP_ROTATION_SPEED: 0.05,
    KEY_STEP_ROTATION_EXTRA: 0.009,
    KEY_STEP_ROTATION_DAMPING: 0.8,
};