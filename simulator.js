// the simulator pre-calculates states in the background (to avoid laggy animation)

var simulator;

importScripts("helper.js", "player_master.js", "fleet_master.js", "planet_master.js", "universe_master.js");

Simulator: function Simulator() {
    this.initialized = false;
};

Simulator.prototype.initialize = function(playerFiles, planetCount, width, height, maxRounds) {
    var playersCount = playerFiles.length;
    if (planetCount < playersCount) planetCount = playersCount;
    shuffleArray(playerFiles);

    this.universe = new Universe(playerFiles, planetCount, width, height, this.run.bind(this));
    this.maxStates = maxRounds;
    this.preCalculateCount = Math.min(this.preCalculateCount, maxRounds);
    this.currentStateCount = 0;
    this.states = [];
    this.simId = createId();
    this.initialized = true;
};

Simulator.prototype.simulate = function simulate() {
    this.universe.step(this.getSteppedCallback());
};

Simulator.prototype.getSteppedCallback = function getSteppedCallback() {
    if (this.currentStateCount < this.maxStates) {
        return function() {
            this.states.push(this.universe.toJSON());
            this.currentStateCount += 1;
            if (this.states.length % this.statesPerMessage == 0) this.postStates();
            this.universe.step(this.getSteppedCallback());
        }.bind(this);

    } else {
        return function() {
            this.states.push(this.universe.toJSON());
            this.currentStateCount += 1;
            this.postStates();
        }.bind(this);
    }
};

Simulator.prototype.postStates = function postStates() {
    var status, action, message, messageLen, activePlayerCount, curCount, preCount;
    curCount = this.currentStateCount;
    preCount = this.preCalculateCount;

    if (curCount < preCount) return;
    status = "ok";
    action = "postStates"
    if (curCount <= preCount + this.statesPerMessage - 1) action = "start";

    message = this.states;
    messageLen = message.length;

    postMessage({
        "status": status,
        "action": action,
        "message": message,
        "id": this.simId,
        "round": this.currentStateCount - messageLen
    });

    activePlayerCount = message[messageLen - 1][_STATE_KEYS["activePlayersCount"]];
    if (curCount >= this.maxRounds || activePlayerCount < 2) this.close();
    this.states = [];
};

Simulator.prototype.run = function run() {
    var status,
        action,
        message;

    if (!simulator.initialized) {

        status = "error";
        action = "unknown"
        message = "trying to simulate without initialization";
        postMessage({"status": status, "action": action, "message": message});

    } else {
        this.states = [this.universe.toJSON()];
        this.currentStateCount += 1;
        this.simulate();
    }
};

Simulator.prototype.close = function close() {
    this.universe.terminateWorkers();
    self.close();
};

Simulator.prototype.statesPerMessage = 1;
Simulator.prototype.preCalculateCount = 20;

simulator = new Simulator();

onmessage = function(oEvent) {
    var planetCount, width, height, maxRounds, playerFiles, data, action;
    data = oEvent.data;
    action = data.action;

    if (action == "start") {

        planetCount = data.planetCount;
        width = data.width;
        height = data.height;
        maxRounds = data.maxRounds;
        playerFiles = data.playerFiles;
        simulator.initialize(playerFiles, planetCount, width, height, maxRounds);

    } else {
        console.log("unrecognized action " + action);
    }
};

onerror = function() {
    this.close();
};
