import { Euler, Quaternion, Vector3 } from "three";

function snapAfterSpin (topGroup, bottomGroup) {
    const snapPoint = {
        x: topGroup.children[4].position.x,
        y: topGroup.children[4].position.y,
    }
    snapPoint.theta = Math.atan2(Math.abs(snapPoint.y - topGroup.position.y), Math.abs(snapPoint.x - topGroup.position.x));
    
    let closestPhoto;
    let closestPhotoX = 0.0;
    let closestPhotoY = 0.0;
    let shortestDistance = Infinity

    topGroup.children.forEach((element) => {
        let positionVector = new Vector3().setFromMatrixPosition(element.matrixWorld);

        // Find the smallest distance from the snap point
        let dx = positionVector.x - snapPoint.x;
        let dy = positionVector.y - snapPoint.y;
        let currentDistance = Math.pow(dx, 2) + Math.pow(dy, 2);
        currentDistance = Math.sqrt(currentDistance);

        if (shortestDistance >= currentDistance) {
            shortestDistance = currentDistance;
            closestPhotoX = positionVector.x;
            closestPhotoY = positionVector.y;
            closestPhoto = element;
        }
    });

    let angleOfClosestPhoto = Math.atan2(Math.abs(closestPhotoY - topGroup.position.y), Math.abs(closestPhotoX - topGroup.position.x));
    let snapAngle = Math.abs(angleOfClosestPhoto - snapPoint.theta);

    // Determines whether the wheels need to be rotated cw or ccw based on the cartesian quadrant it is in.
    if (closestPhotoX > topGroup.position.x && closestPhotoY <= topGroup.position.y) {          // Q1
        snapAngle = angleOfClosestPhoto > snapPoint.theta ? snapAngle : -1.0 * snapAngle;
    } else if (closestPhotoX <= topGroup.position.x && closestPhotoY <= topGroup.position.y) {  // Q2
        snapAngle = angleOfClosestPhoto > snapPoint.theta ? -1.0 * snapAngle : snapAngle;
    } else if (closestPhotoX <= topGroup.position.x && closestPhotoY > topGroup.position.y) {   // Q3
        snapAngle = angleOfClosestPhoto > snapPoint.theta ? snapAngle : -1.0 * snapAngle;
    } else if (closestPhotoX > topGroup.position.x && closestPhotoY >= topGroup.position.y) {   // Q4
        snapAngle = angleOfClosestPhoto > snapPoint.theta ? -1.0 * snapAngle : snapAngle;
    }

    let eulerAngle = new Euler(0, 0, snapAngle)
    let quaternionSnapAngle = new Quaternion(0,0,0,0);
    quaternionSnapAngle.setFromEuler(eulerAngle);


    // ### TODO ### lerp (slerp?) this rotation to be smooth.
    console.log("Group before spin:", topGroup.quaternion);
    console.log("Snap", quaternionSnapAngle);

    topGroup.quaternion.slerp(quaternionSnapAngle, 0.02);
    bottomGroup.quaternion.slerp(quaternionSnapAngle, 0.02);

    // for (let i = 0; i < topGroup.children.length; i++) {
    //     topGroup.children[i].quaternion.slerp(-quaternionSnapAngle, 0.5);
    //     bottomGroup.children[i].quaternion.slerp(-quaternionSnapAngle, 0.5);
    // }

    // topGroup.rotateZ(snapAngle);
    // bottomGroup.rotateZ(snapAngle);

    // for (let i = 0; i < topGroup.children.length; i++) {
    //     topGroup.children[i].rotateZ(-snapAngle);
    //     bottomGroup.children[i].rotateZ(-snapAngle);
    // }

    // console.log("Group after spin:", topGroup.quaternion);

    const projectTitle = document.getElementById('project-title');
    projectTitle.innerHTML = `${closestPhoto.name.projectTitle}`


    // ### TODO ### Scale the snapped photos
}

export { snapAfterSpin };