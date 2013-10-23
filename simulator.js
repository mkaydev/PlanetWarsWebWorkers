Simulator: function Simulator() {
    this.initialized = false;
    this.loggedCount = 0;
    this.alertCount = 0;
};

Simulator.prototype.initialize = function(players, planetCount, width, height) {
    // precalculate some states in advance to avoid laggy animation
    if (planetCount < players.length) planetCount = players.length;
    this.universe = new Universe(players, planetCount, width, height);
    this.firstCache = [];
    this.secondCache = [];
    this.fillStates(this.firstCache);
    this.fillStates(this.secondCache);
    this.initialized = true;
};

Simulator.prototype.addState = function addState(arr) {
    var state = this.universe.exportState();
    arr.push(state);
    this.universe.step();
};

Simulator.prototype.fillStates = function fillStates(arr) {
    var toFillCount = this.statesPerMessage - arr.length;
    for (var i = 0; i < toFillCount; i++) {
        this.addState(arr);
    }
};

Simulator.prototype.log = function log(message) {
    var timestamp = new Date().getTime();
    postMessage({"status": "log", "message": message, "messageId": this.loggedCount++});
};

Simulator.prototype.alert = function alert(message) {
    postMessage({"status": "alert", "message": message, "messageId": this.alertCount++});
};

Simulator.prototype.statesPerMessage = 50;
var simulator = new Simulator();

importScripts(
    "helper.js",
    "player.js",
    "planet.js",
    "universe.js",
    "sample_players.js",
    "battle_school.js",
    "contestants.js"
);


onmessage = function(oEvent) {
    var action = oEvent.data.action;
    if (action === "getStates") {

        if (!simulator.initialized) {

            var status = "error";
            var message = "received getStates before start";
            postMessage({"status": status, "action": action, "message": message});

        } else {

            var status = "ok";
            var message = simulator.firstCache;
            simulator.firstCache = simulator.secondCache;
            simulator.secondCache = [];
            postMessage({"status": status, "action": action, "message": message});
            simulator.fillStates(simulator.secondCache);
        }

    } else if (oEvent.data.action === "start") {

        var planetCount = oEvent.data.planetCount;
        var width = oEvent.data.width;
        var height = oEvent.data.height;
        simulator.initialize(getContestants(), planetCount, width, height);

        var status = "ok";
        var message = {"current": simulator.firstCache, "next": simulator.secondCache};
        postMessage({"status": status, "action": action, "message": message});
        
        simulator.firstCache = [];
        simulator.secondCache = [];
        simulator.fillStates(simulator.firstCache);
        simulator.fillStates(simulator.secondCache);

    } else {

        var status = "error";
        var message = "in worker - unrecognized action: " + oEvent.data.action;
        postMessage({"status": status, "action": action, "message": message});

    }
}