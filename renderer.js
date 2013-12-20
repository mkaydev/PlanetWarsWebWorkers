function Canvas2dRenderer(backgroundCanvas, foregroundCanvas, textCanvas, width, height) {
    var textContext,
        backgroundContext;

    this.width = width;
    this.height = height;

    this.foregroundCanvas = foregroundCanvas;
    this.backgroundCanvas = backgroundCanvas;
    this.textCanvas = textCanvas;

    textContext = this.textCanvas.getContext("2d");
    textContext.fillStyle = "white";
    textContext.strokeStyle = "black";
    textContext.font = "10pt sans-serif";
    textContext.textBaseline = "middle";
    textContext.lineWidth = 2;

    backgroundContext = this.backgroundCanvas.getContext("2d");
    backgroundContext.fillStyle = "black";
    backgroundContext.fillRect(0, 0, width, height);
};

// uses the same JSON format that is used to exchange the universe state between universe master and slave
Canvas2dRenderer.prototype.drawGame = function drawGame(currentState) {
    var i,
        j,
        exportedPlayers,
        exportedFleets,
        exportedPlanets,
        foregroundContext,
        playerId,
        color,
        planets,
        planet,
        fleets,
        fleet,
        centerX,
        centerY,
        radius,
        currentX,
        currentY,
        backRightX,
        backRightY,
        backLeftX,
        backLeftY,
        foregroundCanvas,
        textCanvas,
        textContext,
        x,
        y,
        forces,
        expPlayerKeys;

    exportedPlayers = currentState[_STATE_KEYS["players"]];
    exportedFleets = currentState[_STATE_KEYS["fleets"]];
    exportedPlanets = currentState[_STATE_KEYS["planets"]];

    /* I'd like to keep the planets on the background and draw over them when the owner changes
     * instead of clearing and redrawing, but it doesn't seem possible with canvas' anti-aliasing, which cannot be deactivated
     */
    foregroundCanvas = this.foregroundCanvas;
    foregroundContext = foregroundCanvas.getContext("2d");
    // fastest according to jsperf test
    // for Firefox 24.0 on Ubuntu and Chrome 28.0.1500.71 on Ubuntu Chromium
    foregroundContext.clearRect(0, 0, foregroundCanvas.width, foregroundCanvas.height);

    expPlayerKeys = Object.keys(exportedPlayers);

    // to avoid canvas state changes, loop by color, i.e. by player
    for (i = 0; playerId = expPlayerKeys[i]; ++i) {
        color = exportedPlayers[playerId][_STATE_KEYS["color"]];
        if (!exportedPlanets.hasOwnProperty(playerId)) continue;

        planets = exportedPlanets[playerId];
        if (planets.length == 0) continue;

        foregroundContext.fillStyle = getColorCSS(color);

        for (j = 0; planet = planets[j]; ++j) {
            centerX = planet[_STATE_KEYS["x"]];
            centerY = planet[_STATE_KEYS["y"]];
            radius = planet[_STATE_KEYS["radius"]];

            foregroundContext.beginPath();
            foregroundContext.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            foregroundContext.closePath();
            foregroundContext.fill();
        }

        if (!exportedFleets.hasOwnProperty(playerId)) continue;

        fleets = exportedFleets[playerId];
        if (fleets.length == 0) continue;

        for (j = 0; fleet = fleets[j]; ++j) {
            currentX = fleet[_STATE_KEYS["x"]];
            currentY = fleet[_STATE_KEYS["y"]];

            backRightX = fleet[_STATE_KEYS["backRightX"]];
            backRightY = fleet[_STATE_KEYS["backRightY"]];

            backLeftX = fleet[_STATE_KEYS["backLeftX"]];
            backLeftY = fleet[_STATE_KEYS["backLeftY"]];

            foregroundContext.beginPath();
            foregroundContext.moveTo(currentX, currentY);
            foregroundContext.lineTo(backLeftX, backLeftY);
            foregroundContext.lineTo(backRightX, backRightY);
            foregroundContext.lineTo(currentX, currentY);
            foregroundContext.closePath();
            foregroundContext.fill();
        }
    }

    textCanvas = this.textCanvas;
    textContext = textCanvas.getContext("2d");
    textContext.clearRect(0, 0, textCanvas.width, textCanvas.height);

    for (i = 0; playerId = expPlayerKeys[i]; ++i) {
        if (!exportedPlanets.hasOwnProperty(playerId)) continue;

        planets = exportedPlanets[playerId];
        for (j = 0; planet = planets[j]; ++j) {
            x = planet[_STATE_KEYS["x"]];
            y = planet[_STATE_KEYS["y"]];
            forces = planet[_STATE_KEYS["forces"]];
            textContext.strokeText("" + forces, x, y);
            textContext.fillText("" + forces, x, y);
        }
    }
};

function HybridRenderer(backgroundCanvas, foregroundCanvas, textCanvas, width, height) {
    var textContext,
        vertex,
        fragment,
        gl,
        program;

    this.width = width;
    this.height = height;

    this.foregroundCanvas = foregroundCanvas;
    this.backgroundCanvas = backgroundCanvas;
    this.textCanvas = textCanvas;

    textContext = this.textCanvas.getContext("2d");
    textContext.fillStyle = "white";
    textContext.strokeStyle = "black";
    textContext.font = "10pt sans-serif";
    textContext.textBaseline = "middle";
    textContext.lineWidth = 2;

    gl = this.foregroundCanvas.getContext("webgl") || this.foregroundCanvas.getContext("experimental-webgl");

    vertex = createShaderFromScriptElement(gl, "2d-vertex-shader");
    fragment = createShaderFromScriptElement(gl, "2d-fragment-shader");
    program = createProgram(gl, [vertex, fragment]);
    gl.useProgram(program);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.program = program;
    this.glContext = gl;
};

HybridRenderer.prototype.drawGame = function drawGame(currentState) {
    var i,
        j,
        exportedPlayers,
        exportedFleets,
        exportedPlanets,
        backgroundContext,
        playerId,
        color,
        planets,
        planet,
        fleets,
        centerX,
        centerY,
        radius,
        backgroundCanvas,
        textCanvas,
        textContext,
        x,
        y,
        forces,
        expPlayerKeys,
        gl,
        program,
        positionLocation,
        resolutionLocation,
        colorLocation,
        buffer,
        glInput,
        colorIndices,
        colors,
        drawInput;

    exportedPlayers = currentState[_STATE_KEYS["players"]];
    exportedFleets = currentState[_STATE_KEYS["fleets"]];
    exportedPlanets = currentState[_STATE_KEYS["planets"]];

    /* I'd like to keep the planets on the background and draw over them when the owner changes
     * instead of clearing and redrawing, but it doesn't seem possible with canvas' anti-aliasing, which cannot be deactivated
     */
    backgroundCanvas = this.backgroundCanvas;
    backgroundContext = backgroundCanvas.getContext("2d");
    backgroundContext.fillStyle = "black";
    backgroundContext.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    expPlayerKeys = Object.keys(exportedPlayers);

    // to avoid canvas state changes, loop by color, i.e. by player
    for (i = 0; playerId = expPlayerKeys[i]; ++i) {
        color = exportedPlayers[playerId][_STATE_KEYS["color"]];
        if (!exportedPlanets.hasOwnProperty(playerId)) continue;

        planets = exportedPlanets[playerId];
        if (planets.length == 0) continue;
        backgroundContext.fillStyle = getColorCSS(color);

        for (j = 0; planet = planets[j]; ++j) {
            centerX = planet[_STATE_KEYS["x"]];
            centerY = planet[_STATE_KEYS["y"]];
            radius = planet[_STATE_KEYS["radius"]];

            backgroundContext.beginPath();
            backgroundContext.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            backgroundContext.fill();
        }
    }

    textCanvas = this.textCanvas;
    textContext = textCanvas.getContext("2d");
    textContext.clearRect(0, 0, textCanvas.width, textCanvas.height);

    for (i = 0; playerId = expPlayerKeys[i]; ++i) {
        if (!exportedPlanets.hasOwnProperty(playerId)) continue;

        planets = exportedPlanets[playerId];
        for (j = 0; planet = planets[j]; ++j) {
            x = planet[_STATE_KEYS["x"]];
            y = planet[_STATE_KEYS["y"]];
            forces = planet[_STATE_KEYS["forces"]];
            textContext.strokeText("" + forces, x, y);
            textContext.fillText("" + forces, x, y);
        }
    }

    // there are a lot of fleet objects, which should be drawn as a triangle
    // this seems fitting for WebGL
    gl = this.glContext;
    gl.clear(gl.COLOR_BUFFER_BIT);

    program = this.program;

    positionLocation = gl.getAttribLocation(program, "a_position");
    resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    colorLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform2f(resolutionLocation, this.foregroundCanvas.width, this.foregroundCanvas.height);

    glInput = this.getGLInput(expPlayerKeys, exportedPlayers, exportedFleets);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(glInput.buffer),
        gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    colors = glInput.colors;
    colorIndices = glInput.indices;

    for (i = 0; color = colors[i]; ++i) {
        drawInput = colorIndices[i];
        gl.uniform4f(colorLocation, color[0], color[1], color[2], 0.75);
        gl.drawArrays(gl.TRIANGLES, drawInput[0], drawInput[1]);
    }
};

HybridRenderer.prototype.getGLInput = function getGLInput(expPlayerKeys, expPlayers, expFleets) {
    var i, playerId, color, fleets, vertices, buffer, colorInp, colorKeys;
    buffer = [];
    colorInp = [];
    colorKeys = [];

    for (i = 0; playerId = expPlayerKeys[i]; ++i) {
        color = expPlayers[playerId][_STATE_KEYS["color"]];
        if (!expFleets.hasOwnProperty(playerId)) continue;
        fleets = expFleets[playerId];
        if (fleets.length == 0) continue;

        vertices = this.getFleetVertices(fleets);

        // /2 because each position has a dimension of 2
        colorInp.push([buffer.length / 2, vertices.length / 2]);
        colorKeys.push(color);
        buffer.push.apply(buffer, vertices);
    }

    return {"colors": colorKeys, "indices": colorInp, "buffer": buffer};
};

HybridRenderer.prototype.getFleetVertices = function getFleetVertices(fleets) {
    var i, fleet, vertices;
    vertices = [];
    for (i = 0; fleet = fleets[i]; ++i) {
        vertices.push(fleet[_STATE_KEYS["x"]]);
        vertices.push(fleet[_STATE_KEYS["y"]]);
        vertices.push(fleet[_STATE_KEYS["backLeftX"]]);
        vertices.push(fleet[_STATE_KEYS["backLeftY"]]);
        vertices.push(fleet[_STATE_KEYS["backRightX"]]);
        vertices.push(fleet[_STATE_KEYS["backRightY"]]);
    }
    return vertices;
};