importScripts("helper.js", "player.js", "planet.js", "universe.js", "players.js", "contestants.js");


Simulator: function Simulator() {
    this.initialized = false;
};

Simulator.prototype.initialize = function(players, neutralPlanetCount, width, height) {
    // precalculate some states in advance to avoid laggy animation
    this.universe = new Universe(players, neutralPlanetCount, width, height);
    this.states = [];
    this.fillStates();
    this.initialized = true;
};

// FIFO
Simulator.prototype.removeState = function removeState() {
    if (this.states.length < 1) this.addState();

    var value = this.states[0];
    this.states.splice(0, 1);
    return value;
};

Simulator.prototype.addState = function addState() {
    if (this.states.length >= this.preCalcCount) return;
    var state = this.universe.exportState();
    this.states.push(state);
    this.universe.step();
};

Simulator.prototype.fillStates = function fillStates() {
    var toFillCount = this.preCalcCount - this.states.length;
    for (var i = 0; i < toFillCount; i++) {
        this.addState();
    }
};

Simulator.prototype.preCalcCount = 100;

var simulator = new Simulator();

onmessage = function(oEvent) {
    var action = oEvent.data.action;
    if (action === "getState") {

        if (!simulator.initialized) {

            var status = "error";
            var message = "received getState before start";
            postMessage({"status": status, "action": action, "message": message});

        } else {

            var status = "ok";
            var message = simulator.removeState();
            postMessage({"status": status, "action": action, "message": message});
            simulator.fillStates();

        }

    } else if (oEvent.data.action === "start") {

        var neutralPlanetCount = oEvent.data.neutralPlanetCount;
        var width = oEvent.data.width;
        var height = oEvent.data.height;
        simulator.initialize(contestants, neutralPlanetCount, width, height);

        var status = "ok";
        var message = simulator.removeState();
        postMessage({"status": status, "action": action, "message": message});
        simulator.fillStates();

    } else {

        var status = "error";
        var message = "in worker - unrecognized action: " + oEvent.data.action;
        postMessage({"status": status, "action": action, "message": message});

    }
}