Player: function Player() {};
Player.prototype.isNeutral = false;

Player.prototype.MOVE_isNeutral = function MOVE_isNeutral() {
  return this.isNeutral;
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

Player.prototype.fromMetaData = function fromMetaData(metaData) {
    this.id = metaData.id;
    this.color = metaData.color;
    this.name = metaData.name;
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
    json[_STATE_KEYS["isNeutral"]] = this.MOVE_isNeutral();
    json[_STATE_KEYS["color"]] = this.color;
    json[_STATE_KEYS["name"]] = this.name;
    return json;
};

Player.prototype.think = function think(universe) {};
