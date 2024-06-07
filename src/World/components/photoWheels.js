import {
    TextureLoader,
    MeshStandardMaterial,
    BufferGeometry,
    BufferAttribute,
    Mesh,
    Group,
} from 'three';

function createPhotos () {
    const topGroup = new Group();
    const bottomGroup = new Group();
    const bothGalleries = new Group();

    let screenshotPaths = [
        'public/assets/whatDesigner1.JPG',
        'public/assets/bit.jpg',
        'public/assets/abts1.jpg',
        'public/assets/sb2.jpg',
        'public/assets/sisisBarbershop1.JPG',
        'public/assets/hbc1.JPG',
        'public/assets/color.jpg',
        'public/assets/color.jpg',

        'public/assets/bit2.jpg',
        'public/assets/whatDesigner2.JPG',
        'public/assets/abts2.jpg',
        'public/assets/sb1.jpg',
        'public/assets/sisisBarbershop2.JPG',
        'public/assets/hbc2.JPG',
        'public/assets/color.jpg',
        'public/assets/color.jpg',
    ];

    const wheelRadius = 17;
    const roundedRectangelSize = 5;
    const cornerRadius = 0.25;
    const cornerSmoothness = 12;
    const position = 20.5;

    const numImages = screenshotPaths.length;
    const radianInterval = (2 * Math.PI) / numImages;
    const roundedRectangleGeometry = RoundedRectangle(roundedRectangelSize, roundedRectangelSize, cornerRadius, cornerSmoothness);

    let material = null;
    let topMesh = null;
    let bottomMesh = null;
    const textureLoader = new TextureLoader();

    for (let i = 0; i < numImages; i++) {
        const texture = textureLoader.load(screenshotPaths[i])
        material = createTexture(texture);

        topMesh = new Mesh(roundedRectangleGeometry, material);
        topMesh.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            i * -0.0001
        );

        bottomMesh = topMesh.clone();
        bottomMesh.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            i * (-1 * i * 0.01)
        );
        
        topGroup.add(topMesh);
        bottomGroup.add(bottomMesh);
    }

    // Move each photo wheel into position.
    topGroup.translateY(position);
    bottomGroup.translateY(-position);
    
    let scrollSpeed = 0.0;
    document.addEventListener('wheel', event => {
        // Normalize scroll speed to be 360 degree
        scrollSpeed = (event.deltaY / 360) / 2;
        topGroup.rotateZ(-1.0 * scrollSpeed);
        bottomGroup.rotateZ(-1.0 * scrollSpeed);

        // Adjust photo rotation after scroll movement
        for (let i = 0; i < numImages; i++) {
            topGroup.children[i].rotateZ(scrollSpeed);
            bottomGroup.children[i].rotateZ(scrollSpeed);
        }
    });

    bothGalleries.add(topGroup);
    bothGalleries.add(bottomGroup);
    return bothGalleries;
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