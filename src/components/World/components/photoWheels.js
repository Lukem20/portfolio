import { createTexture } from '../systems/createTexture.js';
import { 
    BufferGeometry,
    BufferAttribute,
    Mesh,
    Group,
} from 'three';

async function createPhotos () {
    // Create top & bottom groups to group the photos into a wheel.
    // Create one group to return both wheels together.
    let topGroup = new Group();
    let bottomGroup = new Group();
    const bothGalleries = new Group();

    // All photos are added to both wheels.
    let screenshotPaths = [
        'src/images/bit.jpg',
        'src/images/whatDesigner1.JPG',
        'src/images/abts1.jpg',
        'src/images/sb2.jpg',
        'src/images/sisisBarbershop1.JPG',
        'src/images/hbc1.JPG',
        'src/images/color.jpg',
        'src/images/color.jpg',

        'src/images/bit2.jpg',
        'src/images/whatDesigner2.JPG',
        'src/images/abts2.jpg',
        'src/images/sb1.jpg',
        'src/images/sisisBarbershop2.JPG',
        'src/images/hbc2.JPG',
        'src/images/color.jpg',
        'src/images/color.jpg',
    ];

    const numImages = screenshotPaths.length;
    const roundedRectangelSize = 105;
    const roundedRectangleGeometry = RoundedRectangle(roundedRectangelSize, roundedRectangelSize, 6, 10);

    // Position and angle parameters for each object
    const wheelRadius = 285;
    const radianInterval = (2 * Math.PI) / numImages;

    // Creating image wheels
    let material = null;
    let topMesh = null;
    let bottomMesh = null;

    for (let i = 0; i < numImages; i++) {
        // Create texture using screenshot image.
        material = await createTexture(screenshotPaths[i]);

        // Top photo wheel
        topMesh = new Mesh(roundedRectangleGeometry, material);
        topMesh.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            i * (-1 * i * 0.01)
        );

        // Bottom photo wheel
        bottomMesh = topMesh.clone();
        bottomMesh.position.set(
            Math.cos(radianInterval * i) * wheelRadius,
            Math.sin(radianInterval * i) * wheelRadius,
            i * (-1 * i * 0.01)
        );

        /**
         * TODO
         * -    Add 'onclick' event listener to each Mesh for its project page
         * -    (or explore wrapping <a href=""></a> around each mesh?)
         */

        // Add each Mesh to its wheel group.
        topGroup.add(topMesh);
        bottomGroup.add(bottomMesh);
    }

    // Move each photo wheel into position.
    topGroup.translateY(360);
    bottomGroup.translateY(-345);
    
    // Scroll event listeners
    let scrollSpeed = 0.0;
    document.addEventListener('wheel', event => {
        scrollSpeed = event.deltaY * (Math.PI / 180) * 0.08;
        topGroup.rotateZ(-1.0 * scrollSpeed);
        bottomGroup.rotateZ(-1.0 * scrollSpeed);

        // Adjust photo rotation after scroll movement
        for (let i = 0; i < numImages; i++) {
            topGroup.children[i].rotateZ(scrollSpeed);
            bottomGroup.children[i].rotateZ(scrollSpeed);
        }
    });

    /**
     * TODO
     * -    Make image squares 'snap' into place.
     */   

    bothGalleries.add(topGroup);
    bothGalleries.add(bottomGroup);
    return bothGalleries;
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