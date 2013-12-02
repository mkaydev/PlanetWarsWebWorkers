var neutralPlayer,
    neutralPlayerJSON = {};


Player: function Player(playerJSON) {
    this.id = playerJSON[_STATE_KEYS["id"]];
    this.isNeutral = playerJSON[_STATE_KEYS["isNeutral"]];
    this.color = playerJSON[_STATE_KEYS["color"]];
    this.name = playerJSON[_STATE_KEYS["name"]];
};

Player.prototype.toJSON = function toJSON() {
    var json = {};
    json[_STATE_KEYS["id"]] = this.id;
    json[_STATE_KEYS["isNeutral"]] = this.isNeutral;
    json[_STATE_KEYS["color"]] = this.color;
    json[_STATE_KEYS["name"]] = this.name;
    return json;
};

neutralPlayerJSON[_STATE_KEYS["id"]] = createId("Player:");
neutralPlayerJSON[_STATE_KEYS["isNeutral"]] = true;
neutralPlayerJSON[_STATE_KEYS["color"]] = [128, 128, 128]; //gray
neutralPlayerJSON[_STATE_KEYS["name"]] = "NeutralPlayer";
neutralPlayer = new Player(neutralPlayerJSON);