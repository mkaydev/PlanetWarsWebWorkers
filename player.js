Player: function Player() {
    this.color = "black";
    this.name = "default";
};

Player.prototype.initialize = function initialize() {
    var id = createId("Player:");
    this.getId = function getId() {
        return id;
    };

    var planetCommands = {};
    this.registerPlanet = function registerPlanet(p, sendFleetCmd) {
        var id = p.getId();
        planetCommands[id] = sendFleetCmd;
    };

    this.deregisterPlanet = function deregisterPlanet(p) {
        var id = p.getId();
        if (!planetCommands.hasOwnProperty(id)) return;
        delete planetCommands[id];
    };

    this.sendFleet = function sendFleet(source, destination, fleetSize) {
        if (isNaN(fleetSize) || fleetSize <= 0) return;
        if (typeof destination === "undefined") return;
        if (typeof source === "undefined") return;
        if (source.ownerEquals(this) && source.getForces() > 0 && source != destination) {
            var size = fleetSize;
            if (size > source.getForces()) size = source.getForces();
            planetCommands[source.getId()](size, destination);
        }
    }.bind(this);

    this.equals = function equals(other) {
        return this.getId() === other.getId();
    };

    this.safeClone = function safeClone() {
        return {"getId": this.getId, "color": this.color, "name": this.name, "equals": this.equals};
    }.bind(this);

};

Player.prototype.isNeutral = false;
Player.prototype.think = function think(universe) {};

NeutralPlayer: function NeutralPlayer() {
    this.color = "grey";
    this.name = "Neutral";
    this.initialize();
};
NeutralPlayer.prototype = new Player();
NeutralPlayer.prototype.constructor = NeutralPlayer;
NeutralPlayer.prototype.isNeutral = true;