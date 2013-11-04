// the simulator pre-calculates states in the background (to avoid laggy animation)

importScripts("helper.js", "player_master.js", "fleet_master.js", "planet_master.js", "universe_master.js");

Simulator: function Simulator() {
    this.initialized = false;
};

Simulator.prototype.initialize = function(playerFiles, planetCount, width, height, maxRounds) {
    if (planetCount < playerFiles.length) planetCount = players.length;
    this.universe = new Universe(playerFiles, planetCount, width, height, this.run.bind(this));
    this.maxStates = maxRounds;
    this.currentStateCount = 0;
    this.states = [];
    this.simId = createId("Simulation:");
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
            if (this.states.length == this.statesPerMessage) this.postStates();
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
    var status = "ok";
    var action = "postStates"
    if (this.currentStateCount == 1) action = "start";
    var message = this.states;
    postMessage({
        "status": status,
        "action": action,
        "message": message,
        "id": this.simId,
        "round": this.currentStateCount
    });
    this.states = [];
};

Simulator.prototype.run = function run() {
    if (!simulator.initialized) {

        var status = "error";
        var action = "unknown"
        var message = "trying to simulate without initialization";
        postMessage({"status": status, "action": action, "message": message});

    } else {
        this.states = [this.universe.toJSON()];
        this.currentStateCount += 1;
        this.postStates();
        this.simulate();
    }
};

Simulator.prototype.statesPerMessage = 2;

var simulator = new Simulator();

onmessage = function(oEvent) {
    var action = oEvent.data.action;
    if (oEvent.data.action === "start") {

        var planetCount = oEvent.data.planetCount;
        var width = oEvent.data.width;
        var height = oEvent.data.height;
        var maxRounds = oEvent.data.maxRounds;
        var playerFiles = oEvent.data.playerFiles;
        simulator.initialize(playerFiles, planetCount, width, height, maxRounds);

    } else {
        console.log("unrecognized action " + action);
    }
};