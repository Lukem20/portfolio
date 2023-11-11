/*
 * A simple object to encapsulate the data and operations of object rasterization
 */
function WebGLGeometryQuad(gl) {
	this.gl = gl;
	this.worldMatrix = new Matrix4();

	// -----------------------------------------------------------------------------
	this.create = function(rawImage) {
        var verts = [
            -1.0,   -1.0,   0.0,
            1.0,    -1.0,   0.0,
            -1.0,   1.0,    0.0,
            1.0,   1.0,    0.0,
        ];

        var normals = [
            0.0,    0.0,    1.0,
            0.0,    0.0,    1.0,
            0.0,    0.0,    1.0,
            0.0,    0.0,    1.0
        ];

        let uvs = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];

        var indices = [0, 1, 2, 2, 1, 3];
        this.indexCount = indices.length;

        // create the position and color information for this object and send it to the GPU
        this.positionBuffer = gl.createBuffer();
        this.gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

        this.normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        this.texCoordsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
        this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
       
        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        if (rawImage) {
            this.texture = this.gl.createTexture();
            this.gl.bindTexture(gl.TEXTURE_2D, this.texture);
            this.gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            this.gl.texImage2D(
                this.gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                rawImage
            );
            this.gl.bindTexture(gl.TEXTURE_2D, null);
        }
	}

	// -------------------------------------------------------------------------
	this.render = function(camera, projectionMatrix, shaderProgram) {
        gl.useProgram(shaderProgram);

        var attributes = shaderProgram.attributes;
        var uniforms = shaderProgram.uniforms;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(
            attributes.vertexPositionAttribute,
            3,
            gl.FLOAT,
            gl.FALSE,
            0,
            0
        );
        gl.enableVertexAttribArray(attributes.vertexPositionAttribute);

        if (attributes.hasOwnProperty('vertexNormalsAttribute')) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.vertexAttribPointer(
                attributes.vertexNormalsAttribute,
                3,
                gl.FLOAT,
                gl.FALSE,
                0,
                0
            );
            gl.enableVertexAttribArray(attributes.vertexNormalsAttribute);
        }

        if (attributes.hasOwnProperty('vertexTexcoordsAttribute')) {
            this.gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
            this.gl.vertexAttribPointer(
                attributes.vertexTexcoordsAttribute,
                2,
                gl.FLOAT,
                gl.FALSE,
                0,
                0
            );
            this.gl.enableVertexAttribArray(attributes.vertexTexcoordsAttribute);
        }

        if (this.texture) {
            this.gl.activeTexture(gl.TEXTURE0);
            this.gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        // Send matrices to the shader
        gl.uniformMatrix4fv(uniforms.worldMatrixUniform, false, this.worldMatrix.clone().transpose().elements);
        gl.uniformMatrix4fv(uniforms.viewMatrixUniform, false, camera.getViewMatrix().clone().transpose().elements);
        gl.uniformMatrix4fv(uniforms.projectionMatrixUniform, false, projectionMatrix.clone().transpose().elements);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

        gl.disableVertexAttribArray(attributes.vertexPositionAttribute);
        gl.disableVertexAttribArray(attributes.vertexNormalsAttribute);
	}
}

// EOF 00100001-10