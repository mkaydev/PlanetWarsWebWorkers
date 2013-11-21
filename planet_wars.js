(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

// ---------------------------------------------------------------------------------------------------------------------------------

PlanetWarsGame: function PlanetWarsGame(planetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId, gameStats) {
    this.planetCount = planetCount;
    this.foregroundCanvasId = foregroundCanvasId;
    this.backgroundCanvasId = backgroundCanvasId;
    this.textCanvasId = textCanvasId;
    this.width = width;
    this.height = height;
    this.gameStats = gameStats;
};

PlanetWarsGame.prototype.initialize = function initialize(playerFiles, initializedCallback) {
    var textContext, context, foregroundSel, backgroundSel, textSel, width, height;
    width = this.width;
    height = this.height;

    this.playerFiles = playerFiles;
    this.initialized = false;
    this.terminateGame();
    this.ended = false;
    this.running = false;
    this.lastStepped = 0;

    this.simulator = new Worker("simulator.js");

    this.simulator.onmessage = function(oEvent) {
        var i,
            state,
            round,
            players,
            activePlayers,
            playerId,
            player,
            exportedPlayer,
            data,
            action,
            status,
            message,
            messageId,
            simId;

        data = oEvent.data;
        action = data.action;
        status = data.status;
        message = data.message;
        messageId = data.messageId;
        simId = data.id;

        if (status == "error") {
            if (typeof messageId !== "undefined") {
                console.log(messageId, message);
            } else {
                console.log(message);
            }

        } else if (action == "postStates") {

            if (this.initialized && (this.simId === simId)) {
                round = data.round;
                for (i = 0; state = message[i]; ++i) {
                    this.states[round + i] = state;
                }
            }

        } else if (action == "start") {
            this.simId = simId;
            this.states = {};
            round = data.round;

            for (i = 0; state = message[i]; ++i) {
                this.states[round + i] = state;
            }

            this.stepState();
            this.initialized = true;
            this.drawGame();

            players = this.currentState[_STATE_KEYS["players"]];
            activePlayers = [];

            for (playerId in players) {
                player = players[playerId];
                if (player[_STATE_KEYS["isNeutral"]]) continue;
                exportedPlayer = this.exportPlayer(player);
                activePlayers.push(exportedPlayer);
            }

            this.gameStats.setPlayerEntries(activePlayers);
            initializedCallback(activePlayers);

        } else if (action == "log") {
            if (typeof messageId !== "undefined") {
                console.log(messageId, message);
            } else {
                console.log(message);
            }

        } else if (action == "alert") {
            if (typeof messageId !== "undefined") {
                alert([messageId, message]);
            } else {
                alert(message);
            }
        } else {
            console.log("unrecognized action " + action);
        }
    }.bind(this);

    this.states = {};
    this.round = 0;

    this.simulator.postMessage(
        {
            "action": "start",
            "playerFiles": this.playerFiles,
            "planetCount": this.planetCount,
            "width": width,
            "height": height,
            "maxRounds": this.maxRounds
        }
    );

    this.foregroundCanvas = document.getElementById(this.foregroundCanvasId);
    this.backgroundCanvas = document.getElementById(this.backgroundCanvasId);
    this.textCanvas = document.getElementById(this.textCanvasId);

    foregroundSel = $("#" + this.foregroundCanvasId);
    foregroundSel.attr("width", width);
    foregroundSel.attr("height", height);

    backgroundSel = $("#" + this.backgroundCanvasId);
    backgroundSel.attr("width", width);
    backgroundSel.attr("height", height);

    textSel = $("#" + this.textCanvasId);
    textSel.attr("width", width);
    textSel.attr("height", height);

    textContext = this.textCanvas.getContext("2d");
    textContext.fillStyle = "white";
    textContext.strokeStyle = "black";
    textContext.font = "10pt sans-serif";
    textContext.textBaseline = "middle";
    textContext.lineWidth = 2;

    context = this.backgroundCanvas.getContext("2d");
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);
};

PlanetWarsGame.prototype.stepState = function stepState() {
    var states, round;
    states = this.states;
    round = this.round;

    if (!states.hasOwnProperty(round)) return false;

    this.currentState = states[round];
    // I'm thinking about a step back feature. When this should be implemented, the following line needs to be removed. (More memory required while running.)
    delete states[round];

    ++this.round;
    this.lastStepped = new Date().getTime();
    return true;
};

PlanetWarsGame.prototype.drawGame = function drawGame() {
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
        currentState,
        foregroundCanvas,
        textCanvas,
        textContext,
        x,
        y,
        forces,
        expPlayerKeys;

    if (!this.initialized) return;
    currentState = this.currentState;
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
        foregroundContext.fillStyle = color;

        for (j = 0; planet = planets[j]; ++j) {
            centerX = planet[_STATE_KEYS["x"]];
            centerY = planet[_STATE_KEYS["y"]];
            radius = planet[_STATE_KEYS["radius"]];

            foregroundContext.beginPath();
            foregroundContext.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            foregroundContext.fill();
        }
    }

    for (i = 0; playerId = expPlayerKeys[i]; ++i) {
        color = exportedPlayers[playerId][_STATE_KEYS["color"]];
        if (!exportedFleets.hasOwnProperty(playerId)) continue;


        fleets = exportedFleets[playerId];
        foregroundContext.strokeStyle = color;

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
            // without this repetition there would be sth. missing from one tip of the triangle, it wouldn't be pointy
            foregroundContext.lineTo(backLeftX, backLeftY);
            foregroundContext.stroke();
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

PlanetWarsGame.prototype.stepInterval = 64;
PlanetWarsGame.prototype.maxRounds = 1500;

PlanetWarsGame.prototype.stepGame = function stepGame(gameEnded) {
    this.endedCallback = gameEnded;
    this.step();
};

PlanetWarsGame.prototype.step = function step() {
    var activePlayersCount,
        now,
        stepFinished,
        playerId,
        players,
        player,
        activePlayers,
        exportedPlayer;

    // either the game is automatically played (play button) -> gameEnded will be a timestamp and this.running will be true
    // or the game is run manually (step button) -> gameEnded has to be the endedCallback, i.e. a function and this.running will be false
    if (!this.initialized) {
        window.requestAnimationFrame(this.step.bind(this));
        return;
    }

    activePlayersCount = this.currentState[_STATE_KEYS["activePlayersCount"]];

    players = this.currentState[_STATE_KEYS["players"]];
    activePlayers = [];

    for (playerId in players) {
        player = players[playerId];
        if (player[_STATE_KEYS["isNeutral"]]) continue;
        exportedPlayer = this.exportPlayer(player);
        activePlayers.push(exportedPlayer);
    }

    if (activePlayersCount > 1 && this.round < this.maxRounds) {
        now = new Date().getTime();
        if (now - this.lastStepped > this.stepInterval) {
            //console.log(now - this.lastStepped);
            stepFinished = this.stepState();
            
            if (!stepFinished) {
                requestAnimationFrame(this.step.bind(this));
                return;
            }
            this.drawGame();
            this.gameStats.updatePlayerEntries(activePlayers);
            this.lastStepped = now;
        }
        if (this.running) requestAnimationFrame(this.step.bind(this));

    } else {
        if (this.ended) return;

        this.drawGame();
        this.running = false;
        this.ended = true;
        this.gameStats.updatePlayerEntries(activePlayers);
        this.endedCallback({"players": activePlayers, "rounds": this.round});
    }
};

PlanetWarsGame.prototype.play = function play(callback) {
    if (this.round >= this.maxRounds) return;
    this.running = true;
    this.endedCallback = callback;
    window.requestAnimationFrame(this.step.bind(this));
};

PlanetWarsGame.prototype.pause = function pause() {
    this.running = false;
};

// I tried using self.close within the worker instead, however sometimes it failed and caused a memory leak, because the workers wouldn't be destroyed.
PlanetWarsGame.prototype.terminateGame = function terminateGame() {
    if (typeof this.simulator !== "undefined") {
        this.simId = null;
        this.currentState = null;
        this.simulator.terminate();
    }
};

PlanetWarsGame.prototype.exportPlayer = function exportPlayer(playerState) {
    var json = {};
    json["name"] = playerState[_STATE_KEYS["name"]];
    json["forces"] = playerState[_STATE_KEYS["forces"]];
    json["color"] = playerState[_STATE_KEYS["color"]];
    json["id"] = playerState[_STATE_KEYS["id"]];
    return json;
};