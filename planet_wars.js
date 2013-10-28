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

// TODO add ranking
// TODO create canvas ids here
PlanetWarsGame: function PlanetWarsGame(planetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId) {
    this.planetCount = planetCount;
    this.foregroundCanvasId = foregroundCanvasId;
    this.backgroundCanvasId = backgroundCanvasId;
    this.textCanvasId = textCanvasId;
    this.width = width;
    this.height = height;
    this.initialize();
};

PlanetWarsGame.prototype.initialize = function initialize() {
    this.initialized = false;
    this.running = false;
    this.lastStepped = 0;

    if (typeof this.simulator !== "undefined") this.simulator.terminate();
    this.simulator = new Worker("simulator.js");

    this.simulator.onmessage = function(oEvent) {
        var action = oEvent.data.action;
        var status = oEvent.data.status;
        var message = oEvent.data.message;
        var messageId = oEvent.data.messageId;
        var simId = oEvent.data.id;

        if (status === "error" || status === "log") {
            if (typeof messageId !== "undefined") {
                console.log(messageId, message);
            } else {
                console.log(message);
            }
        } else if (status === "alert") {
            if (typeof messageId !== "undefined") {
                alert([messageId, message]);
            } else {
                alert(message);
            }
        } else if (action === "postStates") {

            if (this.initialized && (this.simId === simId)) this.nextStateCache.push.apply(this.nextStateCache, message);

        } else if (action === "start") {
            this.simId = simId;
            this.currentStateCache = [];
            this.nextStateCache = [];
            this.currentStateCache.push.apply(this.currentStateCache, message);
            this.stepState();
            this.initialized = true;
            this.drawGame();
        }
    }.bind(this);

    this.currentStateCache = [];
    this.nextStateCache = [];
    this.simulator.postMessage(
        {
            "action": "start",
            "planetCount": this.planetCount,
            "width": this.width,
            "height": this.height,
            "maxRounds": this.maxRounds
        }
    );

    this.round = 0;
    this.currentStateCount = 0;

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
    if (this.currentStateCount >= this.currentStateCache.length) {
        this.currentStateCount = 0;
        this.currentStateCache = this.nextStateCache;
        this.nextStateCache = [];
        if (this.currentStateCache.length == 0) return false;
    }
    
    this.currentState = this.currentStateCache[this.currentStateCount];
    this.currentStateCount += 1;
    this.round += 1;
    this.lastStepped = new Date().getTime();
    
    return true;
};

PlanetWarsGame.prototype.drawGame = function drawGame() {
    if (!this.initialized) return;
    var exportedFleets = this.currentState.fleets;
    var exportedPlanets = this.currentState.planets;

    /* I'd like to keep the planets on the background and draw over them when the owner changes
     * instead of clearing and redrawing, but it doesn't seem possible with canvas' anti-aliasing, which cannot be deactivated
     */
    var foregroundContext = this.foregroundCanvas.getContext("2d");
    // fastest according to jsperf test
    // for Firefox 24.0 on Ubuntu and Chrome 28.0.1500.71 on Ubuntu Chromium
    foregroundContext.clearRect(0, 0, this.foregroundCanvas.width, this.foregroundCanvas.height);

    // to avoid canvas state changes, loop by color, i.e. by player
    for (var color in exportedPlanets) {
        var planets = exportedPlanets[color];
        foregroundContext.fillStyle = color;

        for (var j = 0; j < planets.length; j++) {
            var planet = planets[j];
            var centerX = planet.x;
            var centerY = planet.y;
            var radius = planet.radius;

            foregroundContext.beginPath();
            foregroundContext.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            foregroundContext.fill();
        }
    }

    for (var color in exportedFleets) {
        var fleets = exportedFleets[color];
        foregroundContext.strokeStyle = color;

        for (var j = 0; j < fleets.length; j++) {
            var fleet = fleets[j];
            var currentX = fleet.x;
            var currentY = fleet.y;

            var backRightX = fleet.backRightX;
            var backRightY = fleet.backRightY;

            var backLeftX = fleet.backLeftX;
            var backLeftY = fleet.backLeftY;

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

    for (var color in exportedPlanets) {
        var planets = exportedPlanets[color];
        for (var i = 0; i < planets.length; i++) {
            var planet = planets[i];
            textContext.strokeText("" + planet.forces, planet.x, planet.y);
            textContext.fillText("" + planet.forces, planet.x, planet.y);
        }
    }
};

PlanetWarsGame.prototype.stepInterval = 60;
PlanetWarsGame.prototype.running = false;
PlanetWarsGame.prototype.maxRounds = 2000;

PlanetWarsGame.prototype.step = function step() {
    if (!this.initialized) return;
    var activePlayers = this.currentState.players
    var activePlayersCount = activePlayers.length;

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
        this.drawGame();
        this.running = false;

        var result = "win";
        if (activePlayersCount > 1) result = "draw";
        this.endedCallback({"result": result, "players": activePlayers, "rounds": this.round});
    }
};

PlanetWarsGame.prototype.play = function play(callback) {
    this.running = true;
    this.endedCallback = callback;
    window.requestAnimationFrame(this.step.bind(this));
};

PlanetWarsGame.prototype.pause = function play() {
    this.running = false;
};