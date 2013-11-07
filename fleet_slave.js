Fleet: function Fleet(fleetState, universe) {
    this._universe = universe;
    this._setState(fleetState);
};

Fleet.prototype._setState = function _setState(fleetState) {
    this._state = fleetState;
};

Fleet.prototype.getX = function getX() {
    return this._state[_STATE_KEYS["x"]];
};

Fleet.prototype.getY = function getY() {
    return this._state[_STATE_KEYS["y"]];
};

Fleet.prototype.getId = function getId() {
    return this._state[_STATE_KEYS["id"]];
};

Fleet.prototype.getForces = function getForces() {
    return this._state[_STATE_KEYS["forces"]];
};

Fleet.prototype.getOwner = function getOwner() {
    return this._universe._getPlayer(this._state[_STATE_KEYS["ownerId"]]);
};

Fleet.prototype.getSource = function getSource() {
    return this._universe._getPlanet(this._state[_STATE_KEYS["sourceId"]]);
};

Fleet.prototype.getDestination = function getDestination() {
    return this._universe._getPlanet(this._state[_STATE_KEYS["destinationId"]]);
};

Fleet.prototype.getMovementPerStep = function getMovementPerStep() {
    return this._state[_STATE_KEYS["movementPerStep"]];
};

Fleet.prototype.ownerEquals = function ownerEquals(player) {
    return this.getOwner().equals(player);
};

Fleet.prototype.isHostileToDestination = function isHostileToDestination() {
    return !this.getDestination().ownerEquals(this.getOwner());
};

Fleet.prototype.isHostileTo = function isHostileTo(fleetOrPlanet) {
    return !fleetOrPlanet.ownerEquals(this.getOwner());
};

Fleet.prototype.distanceToPos = function distanceToPos(x, y) {
    var fleetY = this.getY();
    var fleetX = this.getX();

    var yDiff;
    if (y > fleetY) {
        yDiff = y - fleetY;
    } else {
        yDiff = fleetY - y;
    }

    var xDiff;
    if (x > fleetX) {
        xDiff = x - fleetX;
    } else {
        xDiff = fleetX - x;
    }

    var distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return distance;
};

Fleet.prototype.distanceToDestination = function distanceToDestination() {
    var destination = this.getDestination();
    return this.distanceToPos(destination.getX(), destination.getY());
};

Fleet.prototype.stepsToDestination = function stepsToDestination() {
    var distance = this.distanceToDestination();
    return Math.floor(distance / this.getMovementPerStep()) + 1; // players always see fleets after they have stepped or before their first step
};