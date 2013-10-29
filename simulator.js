importScripts("helper.js");

Simulator: function Simulator() {
    this.initialized = false;
    this.loggedCount = 0;
    this.alertCount = 0;
};

Simulator.prototype.initialize = function(players, planetCount, width, height, maxRounds) {
    // precalculate some states in advance to avoid laggy animation
    if (planetCount < players.length) planetCount = players.length;
    this.universe = new Universe(players, planetCount, width, height);
    this.maxStates = maxRounds;
    this.states = [];
    this.currentStateCount = 0;
    this.simId = createId("Simulation:");
    this.initialized = true;
};

Simulator.prototype.addState = function addState(arr) {
    var state = this.universe.exportState();
    arr.push(state);
    this.currentStateCount += 1;
    this.universe.step();
};

Simulator.prototype.fillStates = function fillStates() {
    var toFillCount = this.statesPerMessage - this.states.length;
    for (var i = 0; i < toFillCount; i++) {
        this.addState(this.states);
    }
};

Simulator.prototype.postStates = function postStates() {
    var status = "ok";
    var action = "postStates"
    if (this.currentStateCount == this.statesPerMessage) action = "start";
    var message = this.states;
    postMessage({"status": status, "action": action, "message": message, "id": this.simId});
    this.states = [];
};

Simulator.prototype.run = function run() {
    if (!simulator.initialized) {

        var status = "error";
        var action = "unknown"
        var message = "trying to simulate without initialization";
        postMessage({"status": status, "action": action, "message": message});

    } else {
        while (this.currentStateCount < this.maxStates) {
            this.fillStates();
            this.postStates();
        }
    }
};

Simulator.prototype.log = function log(message) {
    postMessage({"status": "log", "message": message, "messageId": this.loggedCount++});
};

Simulator.prototype.alert = function alert(message) {
    postMessage({"status": "alert", "message": message, "messageId": this.alertCount++});
};

Simulator.prototype.statesPerMessage = 2;
var simulator = new Simulator();

importScripts(
    "player.js",
    "planet.js",
    "universe.js",
    "contestants.js",
    "sample_players.js",
    "battle_school.js"
);


onmessage = function(oEvent) {
    var action = oEvent.data.action;
    if (oEvent.data.action === "start") {

        var planetCount = oEvent.data.planetCount;
        var width = oEvent.data.width;
        var height = oEvent.data.height;
        var maxRounds = oEvent.data.maxRounds;
        var playerNames = oEvent.data.players;
        var contestantInstances = contestants.getInstances(playerNames);
        simulator.initialize(contestantInstances, planetCount, width, height, maxRounds);
        simulator.run();

    } else {

        var status = "error";
        var message = "in worker - unrecognized action: " + oEvent.data.action;
        postMessage({"status": status, "action": action, "message": message});

    }
}