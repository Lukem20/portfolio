import Matter, { MouseConstraint } from "matter-js";

const Engine = Matter.Engine,
    Render = Matter.Render,
    Bodies = Matter.Bodies,
    Runner = Matter.Runner,
    Mouse = Matter.Mouse,
    Composite = Matter.Composite,
    Events = Matter.Events;


const engine = Engine.create();
const world = engine.world;
const canvas = document.querySelector('.webgl');
const render = Render.create({ canvas, engine,
    options: {
        wireframes: false,
        background: '#1c1f25'
    }
});


const designArray = [];
const devArray = [];


// Design Skils
const typeBox = Bodies.rectangle(100, 500, 110, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#5a189a'
    }
});
designArray.push(typeBox);

const webDesignBox = Bodies.rectangle(100, 500, 115, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#5a189a'
    }
});
designArray.push(webDesignBox);

const uxBox = Bodies.rectangle(100, 500, 150, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#5a189a'
    }
});
designArray.push(uxBox);

const uiBox = Bodies.rectangle(100, 500, 185, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#5a189a'
    }
});
designArray.push(uiBox);

const mediaBox = Bodies.rectangle(100, 500, 155, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#5a189a'
    }
});
designArray.push(mediaBox);

const conceptBox = Bodies.rectangle(100, 500, 185, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#5a189a'
    }
});
designArray.push(conceptBox);


// Design Tools
const figmaBox = Bodies.rectangle(500, 100, 80, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#7b2cbf'
    }
});
designArray.push(figmaBox);

const illustratorBox = Bodies.rectangle(500, 100, 100, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#7b2cbf'
    }
});
designArray.push(illustratorBox);

const photoshopBox = Bodies.rectangle(500, 100, 120, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#7b2cbf'
    }
});
designArray.push(photoshopBox);

const premierBox = Bodies.rectangle(500, 100, 120, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#7b2cbf'
    }
});
designArray.push(premierBox);

const wordpressBox = Bodies.rectangle(500, 100, 110, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#7b2cbf'
    }
});
designArray.push(wordpressBox);

const squarespaceBox = Bodies.rectangle(500, 100, 120, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#7b2cbf'
    }
});
designArray.push(squarespaceBox);


// Dev Skills
const semanticBox = Bodies.rectangle(300, 100, 150, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff7900'
    }
});
devArray.push(semanticBox);

const responsiveBox = Bodies.rectangle(300, 100, 160, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff7900'
    }
});
devArray.push(responsiveBox);

const domBox = Bodies.rectangle(300, 100, 150, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff7900'
    }
});
devArray.push(domBox);

const asyncBox = Bodies.rectangle(300, 100, 160, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff7900'
    }
});
devArray.push(asyncBox);

const gitBox = Bodies.rectangle(300, 100, 130, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff7900'
    }
});
devArray.push(gitBox);

const testingBox = Bodies.rectangle(300, 100, 100, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff7900'
    }
});
devArray.push(testingBox);



// Dev Tools
const htmlBox = Bodies.rectangle(700, 100, 80, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff6d00'
    }
});
devArray.push(htmlBox);

const cssBox = Bodies.rectangle(700, 100, 60, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff6d00'
    }
});
devArray.push(cssBox);

const jsBox = Bodies.rectangle(700, 100, 110, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff6d00'
    }
});
devArray.push(jsBox);

const reactBox = Bodies.rectangle(700, 100, 75, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff6d00'
    }
});
devArray.push(reactBox);

const threejsBox = Bodies.rectangle(700, 100, 85, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff6d00'
    }
});
devArray.push(threejsBox);

const nodeBox = Bodies.rectangle(700, 100, 80, 45, { 
    chamfer: { radius: 7 },
    render: {
        fillStyle: '#ff6d00'
    }
});
devArray.push(nodeBox);


Composite.add(world, designArray);
Composite.add(world, devArray);


// Walls
const topWall = Bodies.rectangle(0, 0, 800, 10, { 
    isStatic: true,
    render: {
        strokeStyle: 'transparent',
    }
});
const bottomWall = Bodies.rectangle(0, 0, 800, 10, { 
    isStatic: true,
    render: {
        strokeStyle: 'transparent',
    }
});
const rightWall = Bodies.rectangle(0, 0, 10, 800, { 
    isStatic: true,
    render: {
        strokeStyle: 'transparent',
    }
});
const leftWall = Bodies.rectangle(0, 0, 10, 800, { 
    isStatic: true,
    render: {
        strokeStyle: 'transparent',
    }
});
Composite.add(world, [topWall, bottomWall, rightWall, leftWall]);


const mouse = Mouse.create(canvas);
const mouseBody = Bodies.circle(400, 300, 15, { isStatic: true });
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});


Composite.add(world, [mouseConstraint, mouseBody]);
render.mouse = mouse;


engine.world.gravity.y = 0;
Events.on(engine, 'beforeUpdate', function() {

    // Up - down gravity
    // const gravityForce = 0.001;
    // designArray.forEach(body => {
    //     Matter.Body.applyForce(body, body.position, {
    //         x: 0,
    //         y: -gravityForce * body.mass
    //     });
    // });
    // devArray.forEach(body => {
    //     Matter.Body.applyForce(body, body.position, {
    //         x: 0,
    //         y: gravityForce * body.mass
    //     });
    // });

    const gravityStrength = 0.0005;
    const centerX = render.options.width / 2;
    const centerY = render.options.height / 2;
    
    designArray.forEach(body => {
        const dx = centerX - body.position.x;
        const dy = centerY - body.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            Matter.Body.applyForce(body, body.position, {
                x: (dx / distance) * gravityStrength * body.mass,
                y: (dy / distance) * gravityStrength * body.mass
            });
        }
    });
    
    devArray.forEach(body => {
        const dx = centerX - body.position.x;
        const dy = centerY - body.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            Matter.Body.applyForce(body, body.position, {
                x: (dx / distance) * gravityStrength * body.mass,
                y: (dy / distance) * gravityStrength * body.mass
            });
        }
    });


    if (mouse.position.x && mouse.position.y) {
        Matter.Body.setPosition(mouseBody, {
            x: mouse.position.x,
            y: mouse.position.y
        });
    }
});


Events.on(render, 'afterRender', function() {
    const context = render.context;
    
    const drawText = (body, text) => {
        const pos = body.position;
        const angle = body.angle;
        
        context.save();
        context.translate(pos.x, pos.y);
        context.rotate(angle);
        
        context.font = '16px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 0, 0);
        
        context.restore();
    };

    // Design Skills
    drawText(typeBox, 'Typography');
    drawText(webDesignBox, 'Web Design');
    drawText(uxBox, 'User Experience');
    drawText(uiBox, 'User Interface Design');
    drawText(mediaBox, 'Media Production');
    drawText(conceptBox, 'Concept Development');

    // Design Tools
    drawText(figmaBox, 'Figma');
    drawText(illustratorBox, 'Illustrator');
    drawText(photoshopBox, 'Photoshop');
    drawText(premierBox, 'Premier Pro');
    drawText(wordpressBox, 'Wordpress');
    drawText(squarespaceBox, 'Squarespace');

    // Dev Skills
    drawText(semanticBox, 'Semantic Markup');
    drawText(responsiveBox, 'Responsive Design');
    drawText(domBox, 'DOM Manipulation');
    drawText(asyncBox, 'Async Programming');
    drawText(gitBox, 'Version Control');
    drawText(testingBox, 'Unit Testing');
    
    // Dev Tools
    drawText(htmlBox, 'HTML');
    drawText(cssBox, 'CSS');
    drawText(jsBox, 'JavaScript');
    drawText(reactBox, 'React');
    drawText(threejsBox, 'Three.js');
    drawText(nodeBox, 'Node.js');
});


const runner = Runner.create();
Render.run(render);
Runner.run(runner, engine);

let resizeTimeout;

// Resize
function resizeCanvas() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = displayWidth;
        canvas.height = displayHeight;

        const context = canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(dpr, dpr);
        
        render.bounds.max.x = displayWidth;
        render.bounds.max.y = displayHeight;
        render.options.width = displayWidth;
        render.options.height = displayHeight;
        
        Mouse.setScale(mouse, { x: 1, y: 1 });

        const wallThickness = 50;

        Matter.Body.setPosition(topWall, { x: displayWidth / 2, y: -wallThickness / 2 });
        Matter.Body.setPosition(bottomWall, { x: displayWidth / 2, y: displayHeight + wallThickness / 2 });
        Matter.Body.setPosition(rightWall, { x: displayWidth + wallThickness / 2, y: displayHeight / 2 });
        Matter.Body.setPosition(leftWall, { x: -wallThickness / 2, y: displayHeight / 2 });

        Matter.Body.setVertices(topWall, Bodies.rectangle(displayWidth / 2, -wallThickness / 2, displayWidth + wallThickness * 2, wallThickness).vertices);
        Matter.Body.setVertices(bottomWall, Bodies.rectangle(displayWidth / 2, displayHeight + wallThickness / 2, displayWidth + wallThickness * 2, wallThickness).vertices);
        Matter.Body.setVertices(rightWall, Bodies.rectangle(displayWidth + wallThickness / 2, displayHeight / 2, wallThickness, displayHeight + wallThickness * 2).vertices);
        Matter.Body.setVertices(leftWall, Bodies.rectangle(-wallThickness / 2, displayHeight / 2, wallThickness, displayHeight + wallThickness * 2).vertices);
    }, 100);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);