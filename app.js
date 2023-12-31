var InitDemo = function () {
	loadTextResource('./shader.vs.glsl', function (vsErr, vsText) {
		if (vsErr) {
			alert('Fatal error getting vertex shader (see console)');
			console.error(vsErr);
		} else {
			loadTextResource('./shader.fs.glsl', function (fsErr, fsText) {
				if (fsErr) {
					alert('Fatal error getting fragment shader (see console)');
					console.error(fsErr);
				} else {
					loadJSONResource('./Dragon.json', function (modelErr, modelObj) {
						if (modelErr) {
							alert('Fatal error getting Item model (see console)');
							console.error(fsErr);
						} else {
							loadImage('./dragon.png', function (imgErr, img) {
								if (imgErr) {
									alert('Fatal error getting Item texture (see console)');
									console.error(imgErr);
								} else {
									RunDemo(vsText, fsText, img, modelObj);
								}
							});
						}
					});
				}
			});
		}
	});
};

var RunDemo = function (vertexShaderText, fragmentShaderText, ItemImage, ItemModel) {
	console.log('This is working');
	model = ItemModel;

	var canvas = document.getElementById('game-surface');
	var gl = canvas.getContext('webgl');

	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Your browser does not support WebGL');
	}

	// Inisialisasi matriks transformasi dan lokasi uniform
	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);

	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	//
	// Create shaders
	// 
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}

	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		return;
	}

	//
	// Create buffer
	//
	var itemVertices = ItemModel.meshes[0].vertices;
	var itemIndices = [].concat.apply([], ItemModel.meshes[0].faces);
	var itemTexCoords = ItemModel.meshes[0].texturecoords[0];
	var itemNormals = ItemModel.meshes[0].normals;

	var itemPosVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, itemPosVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(itemVertices), gl.STATIC_DRAW);

	var itemTexCoordVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, itemTexCoordVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(itemTexCoords), gl.STATIC_DRAW);

	var itemIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, itemIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(itemIndices), gl.STATIC_DRAW);

	var itemNormalBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, itemNormalBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(itemNormals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, itemPosVertexBufferObject);
	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	gl.vertexAttribPointer(
		positionAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(positionAttribLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, itemTexCoordVertexBufferObject);
	var texCoordAttribLocation = gl.getAttribLocation(program, 'vertTexCoord');
	gl.vertexAttribPointer(
		texCoordAttribLocation, // Attribute location
		2, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0
	);
	gl.enableVertexAttribArray(texCoordAttribLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, itemNormalBufferObject);
	var normalAttribLocation = gl.getAttribLocation(program, 'vertNormal');
	gl.vertexAttribPointer(
		normalAttribLocation,
		3, gl.FLOAT,
		gl.TRUE,
		3 * Float32Array.BYTES_PER_ELEMENT,
		0
	);
	gl.enableVertexAttribArray(normalAttribLocation);

	//
	// Create texture
	//
	var itemTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, itemTexture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
		gl.UNSIGNED_BYTE,
		ItemImage
	);
	gl.bindTexture(gl.TEXTURE_2D, null);

	// Tell OpenGL state machine which program should be active.
	gl.useProgram(program);

	var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

	var worldMatrix = new Float32Array(16);
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);

	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

	var xRotationMatrix = new Float32Array(16);
	var yRotationMatrix = new Float32Array(16);

	//
	// Lighting information
	//
	gl.useProgram(program);

	var ambientUniformLocation = gl.getUniformLocation(program, 'ambientLightIntensity');
	var sunlightDirUniformLocation = gl.getUniformLocation(program, 'sun.direction');
	var sunlightIntUniformLocation = gl.getUniformLocation(program, 'sun.color');

	gl.uniform3f(ambientUniformLocation, 0.2, 0.2, 0.2);
	gl.uniform3f(sunlightDirUniformLocation, 3.0, 4.0, -2.0);
	gl.uniform3f(sunlightIntUniformLocation, 0.9, 0.9, 0.9);

	//
	// Main render loop
	//

	var angle = 0;
	var xTranslation = 0.0;
	var yTranslation = 0.0;
	var zTranslation = 0.0;


	var sliderX = document.getElementById('x-slider');
	var sliderY = document.getElementById('y-slider');
	var sliderZ = document.getElementById('z-slider');

	// Add event listeners to the sliders
	sliderX.addEventListener('input', function () {
		// Update the X translation based on the slider value
		xTranslation = parseFloat(sliderX.value);
	});

	sliderY.addEventListener('input', function () {
		// Update the Y translation based on the slider value
		yTranslation = parseFloat(sliderY.value);
	});

	sliderZ.addEventListener('input', function () {
		// Update the Z translation based on the slider value
		zTranslation = parseFloat(sliderZ.value);
	});

	var MovingObject = false;

	playbutton.addEventListener('click', function () {
		// Toggle nilai boolean untuk menghentikan atau melanjutkan gerakan
		MovingObject = !MovingObject;
	});

	document.addEventListener('keydown', function (event) {
		if (event.key === 'a') {
			MovingObject = !MovingObject;
		}
	});



	var loop = function () {
		if (!MovingObject) {
			angle = performance.now() / 1000 / 6 * 2 * Math.PI;

			// Apply the translation and rotation to the world matrix
			mat4.identity(worldMatrix);
			mat4.translate(worldMatrix, worldMatrix, [xTranslation, yTranslation, zTranslation]);
			mat4.rotate(worldMatrix, worldMatrix, angle, [0, 1, 0]);

			// Apply the rotation to the world matrix
			mat4.rotate(worldMatrix, worldMatrix, angle, [0, 1, 0]);

			gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
			gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

			gl.clearColor(0.75, 0.85, 0.8, 1.0);
			gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

			gl.bindTexture(gl.TEXTURE_2D, itemTexture);
			gl.activeTexture(gl.TEXTURE0);

			// Ganti untuk menggambar donat
			gl.drawElements(gl.TRIANGLES, itemIndices.length, gl.UNSIGNED_SHORT, 0);

			requestAnimationFrame(loop);

		} else {
			requestAnimationFrame(loop);
		}

	};
	requestAnimationFrame(loop);
};
