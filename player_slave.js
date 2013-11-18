Player: function Player() {
    this.color = "black";
};
Player.prototype.isNeutral = false;

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
    return this.id == otherPlayer.id;
};

Player.prototype.sendFleet = function sendFleet(source, destination, forces) {
    if (!source.ownerEquals(this)) return;
    return source.sendFleet(destination, forces);
};

Player.prototype.fromJSON = function fromJSON(playerState) {
    this.id = playerState[_STATE_KEYS["id"]];
    this.isNeutral = playerState[_STATE_KEYS["isNeutral"]];
    this.color = playerState[_STATE_KEYS["color"]];
    this.name = playerState[_STATE_KEYS["name"]];
};

Player.prototype.toJSON = function toJSON() {
    var json = {};
    json[_STATE_KEYS["id"]] = this.id;
    json[_STATE_KEYS["isNeutral"]] = this.isNeutral;
    json[_STATE_KEYS["color"]] = this.color;
    json[_STATE_KEYS["name"]] = this.name;
    return json;
};

Player.prototype.think = function think(universe) {};