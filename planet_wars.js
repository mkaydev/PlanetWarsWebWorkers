(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

// ---------------------------------------------------------------------------------------------------------------------------------

PlanetWarsGame: function PlanetWarsGame(planetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId, gameStats, useWebGL) {
    this.planetCount = planetCount;
    this.foregroundCanvasId = foregroundCanvasId;
    this.backgroundCanvasId = backgroundCanvasId;
    this.textCanvasId = textCanvasId;
    this.width = width;
    this.height = height;
    this.gameStats = gameStats;
    this.renderer = this.createRenderer(useWebGL);
};

PlanetWarsGame.prototype.initialize = function initialize(playerFiles, initializedCallback) {
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
            "width": this.width,
            "height": this.height,
            "maxRounds": this.maxRounds
        }
    );
};

PlanetWarsGame.prototype.createRenderer = function createRenderer(useWebGL) {
    var foregroundSel,
        backgroundSel,
        textSel,
        foregroundCanvas,
        backgroundCanvas,
        textCanvas;
    foregroundSel = $("#" + this.foregroundCanvasId);
    foregroundSel.attr("width", this.width);
    foregroundSel.attr("height", this.height);

    backgroundSel = $("#" + this.backgroundCanvasId);
    backgroundSel.attr("width", this.width);
    backgroundSel.attr("height", this.height);

    textSel = $("#" + this.textCanvasId);
    textSel.attr("width", this.width);
    textSel.attr("height", this.height);

    foregroundCanvas = foregroundSel[0];
    backgroundCanvas = backgroundSel[0];
    textCanvas = textSel[0];

    if (useWebGL && (foregroundCanvas.getContext("webgl") || foregroundCanvas.getContext("experimental-webgl"))) {
        return new HybridRenderer(
            backgroundCanvas,
            foregroundCanvas,
            textCanvas,
            this.width,
            this.height
        );
    } else {
        return new Canvas2dRenderer(
            backgroundCanvas,
            foregroundCanvas,
            textCanvas,
            this.width,
            this.height
        );
    }
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
    if (!this.initialized) return;
//    var start = new Date().getTime();
    this.renderer.drawGame(this.currentState);
//    var end = new Date().getTime();
//    console.log(end - start);
};

PlanetWarsGame.prototype.stepInterval = 80;
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



    if (activePlayersCount > 1 && this.round < this.maxRounds) {
        now = new Date().getTime();
        if (now - this.lastStepped > this.stepInterval) {
            stepFinished = this.stepState();
            
            if (!stepFinished) {
                window.requestAnimationFrame(this.step.bind(this));
                return;
            }
            this.drawGame();
            this.lastStepped = now;
        }

    } else {
        if (this.ended) return;
        this.drawGame();
        this.running = false;
        this.ended = true;
    }

    players = this.currentState[_STATE_KEYS["players"]];
    activePlayers = [];

    for (playerId in players) {
        player = players[playerId];
        if (player[_STATE_KEYS["isNeutral"]]) continue;
        exportedPlayer = this.exportPlayer(player);
        activePlayers.push(exportedPlayer);
    }

    this.gameStats.updatePlayerEntries(activePlayers);
    if (this.running) window.requestAnimationFrame(this.step.bind(this));
    if (this.ended) this.endedCallback({"players": activePlayers, "rounds": this.round});
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