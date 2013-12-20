function PlanetWarsSimulator(initializedCallback) {
    this.simulator = new Worker("simulator_worker.js");
    this.simulator.onmessage = function(oEvent) {
        var data,
            action,
            status,
            players;

        data = oEvent.data;
        status = data.status;
        action = data.action;

        if (status == "error") {
            console.log(data);
        } else if (action == "postPlayers") {
            players = data.players;
            this.players = players;
            initializedCallback(this);

        } else if (action == "log") {
            console.log(data);
        } else if (action == "alert") {
            window.alert(data);
        } else {
            console.log("unrecognized action " + action);
        }

    }.bind(this);
    this.simulator.postMessage({"action": "initialize"});
};

PlanetWarsSimulator.prototype.postMessage = function postMessage(msg) {
    this.simulator.postMessage(msg);
};

PlanetWarsSimulator.prototype.setOnMessage = function setOnMessage(callback) {
    this.simulator.onmessage = callback;
};

PlanetWarsSimulator.prototype.reset = function reset() {
    if (typeof this.simulator !== "undefined") {
        this.simulator.terminate();
        this.simulator = new Worker("simulator_worker.js");
    };
};