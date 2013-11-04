Player: function Player() {
    this.color = "black";
};

Player.prototype.initialize = function initialize() {
    this.name = arguments.callee.caller.name;
};

Player.prototype._setId = function _setId(id) {
    this.id = id;
};

Player.prototype._setNeutral = function _setNeutral(isNeutral) {
    this.isNeutral = isNeutral;
};

Player.prototype.equals = function equals(otherPlayer) {
    return this.id === otherPlayer.id;
};

Player.prototype.sendFleet = function sendFleet(source, destination, forces) {
    if (!source.ownerEquals(this)) return;
    return source.sendFleet(destination, forces);
};

Player.prototype.isNeutral = false;
Player.prototype.toJSON = function toJSON() {
    return {
        "id": this.id,
        "name": this.name,
        "color": this.color,
        "isNeutral": this.isNeutral
    };
};

Player.prototype.think = function think(universe) {};