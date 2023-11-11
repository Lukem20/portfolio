function Camera(input) {
    // The following two parameters will be used to automatically create the cameraWorldMatrix in this.update()
    this.cameraYaw = 0;
    this.cameraPosition = new Vector3();

    this.cameraWorldMatrix = new Matrix4();

    // -------------------------------------------------------------------------
    this.getViewMatrix = function() {
        return this.cameraWorldMatrix.clone().inverse();
    }

    // -------------------------------------------------------------------------
    this.getForward = function() {
        let x = this.cameraWorldMatrix.getElement(0, 2);
        let y = this.cameraWorldMatrix.getElement(1, 2);
        let z = this.cameraWorldMatrix.getElement(2, 2);

        return new Vector3(x, y, z);
    }

    // -------------------------------------------------------------------------
    this.update = function(dt) {
        var currentForward = this.getForward();
        currentForward.multiplyScalar(0.1);

        if (input.up) {
            this.cameraPosition.subtract(currentForward);
        }

        if (input.down) {
            this.cameraPosition.add(currentForward);
        }

        if (input.left) {
            this.cameraYaw++;
        }

        if (input.right) {
            this.cameraYaw--;
        }

        this.cameraWorldMatrix.makeTranslation(this.cameraPosition);
        this.cameraWorldMatrix.multiply(new Matrix4().makeRotationY(this.cameraYaw));
        // (order matters!)
    }
}

// EOF 00100001-10