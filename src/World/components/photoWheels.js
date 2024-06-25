import {
    TextureLoader,
    MeshStandardMaterial,
    BufferGeometry,
    BufferAttribute,
    Mesh,
    Group,
    Vector3,
    Matrix4,
    Vector2,
    Raycaster
} from 'three';

function createPhotos (camera) {
    let photos = [
        '/assets/whatDesigner1.JPG',
        '/assets/bit.jpg',
        '/assets/abts1.jpg',
        '/assets/sb2.jpg',
        '/assets/sisisBarbershop1.JPG',
        '/assets/hbc1.JPG',
        '/assets/color.jpg',
        '/assets/color.jpg',
        // Make top and bottom half of this array same project order.
        '/assets/whatDesigner2.JPG',
        '/assets/bit2.jpg',
        '/assets/abts2.jpg',
        '/assets/sb1.jpg',
        '/assets/sisisBarbershop2.JPG',
        '/assets/hbc2.JPG',
        '/assets/color.jpg',
        '/assets/color.jpg',
    ];

    const wheelRadius = 180;
    const wheelPosition = 213;
    const geometry = {
        size: 80,
        cornerRadius: 4,
        cornerSmoothness: 12,
    }

    const photoCount = photos.length;
    const radianInterval = (2 * Math.PI) / photoCount;
    const roundedRectangleGeometry = RoundedRectangle(geometry.size, geometry.size, geometry.cornerRadius, geometry.cornerSmoothness);

    let material = null;
    let texture = null;
    let photoMeshTop = null;
    let photoMeshBottom = null;
    const textureLoader = new TextureLoader();

    const topGroup = new Group();
    const bottomGroup = new Group();
    const photoWheels = new Group();
    const allPhotoMeshes = [];

    // Create photo wheel mesh items.
    for (let i = 0; i < photoCount; i++) {
        texture = textureLoader.load(photos[i])
        material = createTexture(texture);

        photoMeshTop = new Mesh(roundedRectangleGeometry, material);
        photoMeshTop.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            1
        );

        photoMeshBottom = photoMeshTop.clone();
        photoMeshBottom.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            1
        );
        
        topGroup.add(photoMeshTop);
        bottomGroup.add(photoMeshBottom);
        allPhotoMeshes.push(photoMeshTop);
        allPhotoMeshes.push(photoMeshBottom);
    }

    // Move each photo wheel into position after all photos are added.
    topGroup.translateY(wheelPosition);
    bottomGroup.translateY(-wheelPosition);
    
    // Rotate wheels on scroll.
    let spinInProgress = null;
    let scrollSpeed = 0.0;
    const snapPoint = {
        x: topGroup.children[4].position.x,
        y: topGroup.children[4].position.y,
    }
    snapPoint.theta = Math.atan2(Math.abs(snapPoint.y - topGroup.position.y), Math.abs(snapPoint.x - topGroup.position.x));

    document.addEventListener('wheel', event => {
        clearTimeout(spinInProgress);

        for (const mesh of allPhotoMeshes) {
            mesh.scale.normalize();
        }
        
        // Normalize user scroll speed value to be 360 degree.
        scrollSpeed = (event.deltaY / 360) / 2;
        topGroup.rotateZ(-scrollSpeed);
        bottomGroup.rotateZ(-scrollSpeed);

        // Adjust photo wheel items' rotation during scroll movement.
        for (let i = 0; i < photoCount; i++) {
            topGroup.children[i].rotateZ(scrollSpeed);
            bottomGroup.children[i].rotateZ(scrollSpeed);
        }

        // Adjust timeout time for snapping delay after the wheel stops spinning.
        spinInProgress = setTimeout(() => {
            snapWheelsAfterSpin(topGroup, bottomGroup, snapPoint);
        }, 350);
    });

    photoWheels.add(topGroup);
    photoWheels.add(bottomGroup);

    // Mouse hover detection
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    window.addEventListener('mousemove', (event) => {
        // Normalized mouse coordinates
        mouse.x = event.clientX / window.innerWidth * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight * 2 - 1);

    });

    const hoverScaleMatrix = new Matrix4().makeScale(1.2, 1.2, 1.2);

    photoWheels.tick = (delta) => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(photoWheels.children);

        for (const allOtherPhotos of allPhotoMeshes) {
            allOtherPhotos.scale.normalize();
        }

        for (const intersect of intersects) {
            /**
             * TODO
             * Scale intersect by hoverScaleMatrix
            */     
            //    intersect.object.applyMatrix4(hoverScaleMatrix);
        }
    }

    return photoWheels;
}

const snapScaleMatrix = new Matrix4().makeScale(1.1, 1.1, 1.1);

function snapWheelsAfterSpin (topGroup, bottomGroup, snapPoint) {
    let closestPhoto = null;
    let closestPhotoX, closestPhotoY;
    let worldMatrix = new Matrix4(topGroup.children[2].matrixWorld);
    worldMatrix = topGroup.children[2].matrixWorld;

    // Default distance to compare after spin has stopped
    let positionVector = new Vector3().setFromMatrixPosition(worldMatrix);
    let shortestDistance = Infinity

    topGroup.children.forEach((element, index) => {
        // Get this photo's position from its world matrix. 
        worldMatrix = element.matrixWorld;
        positionVector = new Vector3().setFromMatrixPosition(worldMatrix);

        // Find the smallest distance from the snap point
        let dx = positionVector.x - snapPoint.x;
        let dy = positionVector.y - snapPoint.y;
        let currentDistance = Math.pow(dx, 2) + Math.pow(dy, 2);
        currentDistance = Math.sqrt(currentDistance);

        if (shortestDistance >= currentDistance) {
            shortestDistance = currentDistance;
            closestPhoto = element;
            closestPhotoX = positionVector.x;
            closestPhotoY = positionVector.y;
        }
    });

    let angleOfClosestPhoto = Math.atan2(Math.abs(closestPhotoY - topGroup.position.y), Math.abs(closestPhotoX - topGroup.position.x));
    let snapAngle = Math.abs(angleOfClosestPhoto - snapPoint.theta);

    // Determines whether the wheels need to be rotated cw or ccw 
    // by which cartesian quadrant it is in.
    if (closestPhotoX > topGroup.position.x && closestPhotoY <= topGroup.position.y) {          // Q1
        snapAngle = angleOfClosestPhoto > snapPoint.theta ? snapAngle : -1.0 * snapAngle;
    } else if (closestPhotoX <= topGroup.position.x && closestPhotoY <= topGroup.position.y) {  // Q2
        snapAngle = angleOfClosestPhoto > snapPoint.theta ? -1.0 * snapAngle : snapAngle;
    } else if (closestPhotoX <= topGroup.position.x && closestPhotoY > topGroup.position.y) {   // Q3
        snapAngle = angleOfClosestPhoto > snapPoint.theta ? snapAngle : -1.0 * snapAngle;
    } else if (closestPhotoX > topGroup.position.x && closestPhotoY >= topGroup.position.y) {   // Q4
        snapAngle = angleOfClosestPhoto > snapPoint.theta ? -1.0 * snapAngle : snapAngle;
    }

    // Rotate both wheels by the angle to snap them into place.
    topGroup.rotateZ(snapAngle);
    bottomGroup.rotateZ(snapAngle);

    for (let i = 0; i < topGroup.children.length; i++) {
        topGroup.children[i].rotateZ(-snapAngle);
        bottomGroup.children[i].rotateZ(-snapAngle);
    }

    /**
     * TODO
     * Scale closestPhoto and its wheel counterpart by snapScaleMatrix
     */
    // closestPhoto.applyMatrix4(snapScaleMatrix);
}

function createTexture (texture) {    
    return new MeshStandardMaterial({ 
        map: texture,
        transparent: true,
        opacity: 1
    });
}

// https://discourse.threejs.org/t/roundedrectangle-squircle/28645
function RoundedRectangle( w, h, r, s ) { // width, height, radius corner, smoothness  
	const wi = w / 2 - r;		// inner width
	const hi = h / 2 - r;		// inner height
	const w2 = w / 2;			// half width
	const h2 = h / 2;			// half height
	const ul = r / w;			// u left
	const ur = ( w - r ) / w;	// u right
	const vl = r / h;			// v low
	const vh = ( h - r ) / h;	// v high
	
	let positions = [
		-wi, -h2, 0,  wi, -h2, 0,  wi, h2, 0,
		-wi, -h2, 0,  wi,  h2, 0, -wi, h2, 0,
		-w2, -hi, 0, -wi, -hi, 0, -wi, hi, 0,
		-w2, -hi, 0, -wi,  hi, 0, -w2, hi, 0,
		 wi, -hi, 0,  w2, -hi, 0,  w2, hi, 0,
		 wi, -hi, 0,  w2,  hi, 0,  wi, hi, 0
	];
	let uvs = [
		ul,  0, ur,  0, ur,  1,
		ul,  0, ur,  1, ul,  1,
		 0, vl, ul, vl, ul, vh,
		 0, vl, ul, vh,  0, vh,
		ur, vl,  1, vl,  1, vh,
		ur, vl,  1, vh,	ur, vh 
	];
	let phia = 0; 
	let phib, xc, yc, uc, vc, cosa, sina, cosb, sinb;
	
	for ( let i = 0; i < s * 4; i ++ ) {
		phib = Math.PI * 2 * ( i + 1 ) / ( 4 * s );
		
		cosa = Math.cos( phia );
		sina = Math.sin( phia );
		cosb = Math.cos( phib );
		sinb = Math.sin( phib );
		
		xc = i < s || i >= 3 * s ? wi : - wi;
		yc = i < 2 * s ? hi : -hi;
		positions.push( xc, yc, 0, xc + r * cosa, yc + r * sina, 0,  xc + r * cosb, yc + r * sinb, 0 );
		
		uc =  i < s || i >= 3 * s ? ur : ul;
		vc = i < 2 * s ? vh : vl;
		uvs.push( uc, vc, uc + ul * cosa, vc + vl * sina, uc + ul * cosb, vc + vl * sinb );
		
		phia = phib;
	}
	
	const geometry = new BufferGeometry( );
	geometry.setAttribute( 'position', new BufferAttribute( new Float32Array( positions ), 3 ) );
	geometry.setAttribute( 'uv', new BufferAttribute( new Float32Array( uvs ), 2 ) );
	
	return geometry;
}

export { createPhotos }