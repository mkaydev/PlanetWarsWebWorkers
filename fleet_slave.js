Fleet: function Fleet(fleetState, universe) {
    this._universe = universe;
    this.x = fleetState.x;
    this.y = fleetState.y;
    this.id = fleetState.id;
    this.forces = fleetState.forces;
    this.movementPerStep = fleetState.movementPerStep;
    this.owner = this._universe._getPlayer(fleetState.owner.id);
    this.source = this._universe._getPlanet(fleetState.source.id);
    this.destination = this._universe._getPlanet(fleetState.destination.id);
};

Fleet.prototype.getMovementPerStep = function getMovementPerStep() {
    return this._universe.fleetMovementPerStep;
};

Fleet.prototype.ownerEquals = function ownerEquals(player) {
    return this.owner.equals(player);
};

Fleet.prototype.isHostileToDestination = function isHostileToDestination() {
    return !this.destination.ownerEquals(this.owner);
};

Fleet.prototype.isHostileTo = function isHostileTo(fleetOrPlanet) {
    return !fleetOrPlanet.ownerEquals(this.owner);
};

Fleet.prototype.distanceToPos = function distanceToPos(x, y) {
    var yDiff;
    if (y > this.y) {
        yDiff = y - this.y;
    } else {
        yDiff = this.y - y;
    }

    var xDiff;
    if (x > this.x) {
        xDiff = x - this.x;
    } else {
        xDiff = this.x - x;
    }

    var distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return distance;
};

Fleet.prototype.distanceToDestination = function distanceToDestination() {
    return this.distanceToPos(this.destination.x, this.destination.y);
};

Fleet.prototype.stepsToDestination = function stepsToDestination() {
    var distance = this.distanceToDestination();
    return Math.floor(distance / this.getMovementPerStep()) + 1; // players always see fleets after they have stepped or before their first step
};