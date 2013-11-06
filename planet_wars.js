/*
    responsible for running the game (e.g. deciding when the game has ended)
    and for visualizing the current status of the universe
 */

(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

// ---------------------------------------------------------------------------------------------------------------------------------

PlanetWarsGame: function PlanetWarsGame(playerFiles, initializedCallback,  planetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId) {
    this.playerFiles = playerFiles;
    this.planetCount = planetCount;
    this.foregroundCanvasId = foregroundCanvasId;
    this.backgroundCanvasId = backgroundCanvasId;
    this.textCanvasId = textCanvasId;
    this.width = width;
    this.height = height;
    this.initialize(initializedCallback);
};

PlanetWarsGame.prototype.initialize = function initialize(initializedCallback) {
    this.initialized = false;
    this.terminateGame();
    this.ended = false;
    this.running = false;
    this.lastStepped = 0;

    this.simulator = new Worker("simulator.js");

    this.simulator.onmessage = function(oEvent) {
        var action = oEvent.data.action;
        var status = oEvent.data.status;
        var message = oEvent.data.message;
        var messageId = oEvent.data.messageId;
        var simId = oEvent.data.id;

        if (status === "error") {
            if (typeof messageId !== "undefined") {
                console.log(messageId, message);
            } else {
                console.log(message);
            }

        } else if (action === "postStates") {
            if (this.initialized && (this.simId === simId)) {
                var round = oEvent.data.round;
                for (var i = 0; i < message.length; i++) {
                    var state = message[i];
                    this.states[round + i] = state;
                }            }

        } else if (action === "start") {
            this.simId = simId;
            this.states = {};
            var round = oEvent.data.round;
            for (var i = 0; i < message.length; i++) {
                var state = message[i];
                this.states[round + i] = state;
            }

            this.stepState();
            this.initialized = true;
            this.drawGame();

            var players = this.currentState[_STATE_KEYS["players"]];
            var activePlayers = [];
            for (var playerId in players) {
                var player = players[playerId];
                if (player[_STATE_KEYS["isNeutral"]]) continue;
                var exportedPlayer = this.exportPlayer(player);
                activePlayers.push(exportedPlayer);
            }
            initializedCallback(activePlayers);

        } else if (action === "log") {
            if (typeof messageId !== "undefined") {
                console.log(messageId, message);
            } else {
                console.log(message);
            }

        } else if (action === "alert") {
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
            "width": this.width,
            "height": this.height,
            "maxRounds": this.maxRounds
        }
    );

    this.foregroundCanvas = document.getElementById(this.foregroundCanvasId);
    this.backgroundCanvas = document.getElementById(this.backgroundCanvasId);
    this.textCanvas = document.getElementById(this.textCanvasId);

    $("#" + this.foregroundCanvasId).attr("width", this.width);
    $("#" + this.foregroundCanvasId).attr("height", this.height);
    $("#" + this.backgroundCanvasId).attr("width", this.width);
    $("#" + this.backgroundCanvasId).attr("height", this.height);
    $("#" + this.textCanvasId).attr("width", this.width);
    $("#" + this.textCanvasId).attr("height", this.height);

    var textContext = this.textCanvas.getContext("2d");
    textContext.fillStyle = "white";
    textContext.strokeStyle = "black";
    textContext.font = "10pt sans-serif";
    textContext.textBaseline = "middle";
    textContext.lineWidth = 2;

    var context = this.backgroundCanvas.getContext("2d");
    context.fillStyle = "black";
    context.fillRect(0, 0, this.width, this.height);
};

PlanetWarsGame.prototype.stepState = function stepState() {
    if (!this.states.hasOwnProperty(this.round)) return false;
    this.currentState = this.states[this.round];
    // I'm thinking about a step back feature. When this should be implemented, the following line needs to be removed. (More memory required while running.)
    delete this.states[this.round];
    this.round += 1;
    this.lastStepped = new Date().getTime();
    return true;
};

PlanetWarsGame.prototype.drawGame = function drawGame() {
    if (!this.initialized) return;
    var exportedPlayers = this.currentState[_STATE_KEYS["players"]];
    var exportedFleets = this.currentState[_STATE_KEYS["fleets"]];
    var exportedPlanets = this.currentState[_STATE_KEYS["planets"]];

    /* I'd like to keep the planets on the background and draw over them when the owner changes
     * instead of clearing and redrawing, but it doesn't seem possible with canvas' anti-aliasing, which cannot be deactivated
     */
    var foregroundContext = this.foregroundCanvas.getContext("2d");
    // fastest according to jsperf test
    // for Firefox 24.0 on Ubuntu and Chrome 28.0.1500.71 on Ubuntu Chromium
    foregroundContext.clearRect(0, 0, this.foregroundCanvas.width, this.foregroundCanvas.height);

    // to avoid canvas state changes, loop by color, i.e. by player
    for (var playerId in exportedPlayers) {
        var color = exportedPlayers[playerId][_STATE_KEYS["color"]];
        if (!exportedPlanets.hasOwnProperty(playerId)) continue;

        var planets = exportedPlanets[playerId];
        foregroundContext.fillStyle = color;

        for (var j = 0; j < planets.length; j++) {
            var planet = planets[j];
            var centerX = planet[_STATE_KEYS["x"]];
            var centerY = planet[_STATE_KEYS["y"]];
            var radius = planet[_STATE_KEYS["radius"]];

            foregroundContext.beginPath();
            foregroundContext.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            foregroundContext.fill();
        }
    }

    for (var playerId in exportedPlayers) {
        var color = exportedPlayers[playerId][_STATE_KEYS["color"]];
        if (!exportedFleets.hasOwnProperty(playerId)) continue;


        var fleets = exportedFleets[playerId];
        foregroundContext.strokeStyle = color;

        for (var j = 0; j < fleets.length; j++) {
            var fleet = fleets[j];
            var currentX = fleet[_STATE_KEYS["x"]];
            var currentY = fleet[_STATE_KEYS["y"]];

            var backRightX = fleet[_STATE_KEYS["backRightX"]];
            var backRightY = fleet[_STATE_KEYS["backRightY"]];

            var backLeftX = fleet[_STATE_KEYS["backLeftX"]];
            var backLeftY = fleet[_STATE_KEYS["backLeftY"]];

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

    var textContext = this.textCanvas.getContext("2d");
    textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);

    for (var playerId in exportedPlayers) {
        if (!exportedPlanets.hasOwnProperty(playerId)) continue;

        var planets = exportedPlanets[playerId];
        for (var i = 0; i < planets.length; i++) {
            var planet = planets[i];
            var x = planet[_STATE_KEYS["x"]];
            var y = planet[_STATE_KEYS["y"]];
            var forces = planet[_STATE_KEYS["forces"]];
            textContext.strokeText("" + forces, x, y);
            textContext.fillText("" + forces, x, y);
        }
    }
};

PlanetWarsGame.prototype.stepInterval = 60;
PlanetWarsGame.prototype.maxRounds = 1000;

PlanetWarsGame.prototype.step = function step(gameEnded) {
    // either the game is automatically played (play button) -> gameEnded will be a timestamp and this.running will be true
    // or the game is run manually (step button) -> gameEnded has to be the endedCallback, i.e. a function and this.running will be false
    if (!this.running && typeof gameEnded !== "function") return;
    if (!this.initialized) {
        window.requestAnimationFrame(this.step.bind(this));
        return;
    }

    var activePlayersCount = this.currentState[_STATE_KEYS["activePlayersCount"]];

    if (activePlayersCount > 1 && this.round < this.maxRounds) {
        var now = new Date().getTime();
        if (now - this.lastStepped > this.stepInterval) {
            var stepFinished = this.stepState();
            
            if (!stepFinished) {
                requestAnimationFrame(this.step.bind(this));
                return;
            }
            this.drawGame();
            this.lastStepped = now;
        }
        if (this.running) requestAnimationFrame(this.step.bind(this));

    } else {
        if (this.ended) return;
        this.drawGame();
        this.running = false;
        var players = this.currentState[_STATE_KEYS["players"]];
        var activePlayers = [];
        for (var playerId in players) {
            var player = players[playerId];
            if (player[_STATE_KEYS["isNeutral"]]) continue;
            var exportedPlayer = this.exportPlayer(player);
            activePlayers.push(exportedPlayer);
        }
        if (typeof this.endedCallback === "undefined") this.endedCallback = gameEnded;
        this.ended = true;
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

PlanetWarsGame.prototype.terminateGame = function terminateGame() {
    if (typeof this.simulator !== "undefined") {
        this.simId = null;
        this.currentState = null;
        if (!this.ended) this.simulator.terminate();  // otherwise the worker finished and already closed itself
    }
};

PlanetWarsGame.prototype.exportPlayer = function exportPlayer(playerState) {
    var json = {};
    json["name"] = playerState[_STATE_KEYS["name"]];
    json["forces"] = playerState[_STATE_KEYS["forces"]];
    json["color"] = playerState[_STATE_KEYS["color"]];
    return json;
};