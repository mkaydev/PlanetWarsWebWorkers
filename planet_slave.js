Planet: function Planet(planetState, universe) {
    this.x = planetState.x;
    this.y = planetState.y;
    this.id = planetState.id;
    this.forces = planetState.forces;
    this.recruitingPerStep = planetState.recruitingPerStep;
    this._universe = universe;
    this.owner = this._universe._getPlayer(planetState.owner.id);
};

Planet.prototype.equals = function equals(otherPlanet) {
    return this.id === otherPlanet.id;
};

Planet.prototype.ownerEquals = function ownerEquals(player) {
    return this.owner.equals(player);
};

Planet.prototype.distanceTo = function distanceTo(otherPlanet) {
    var yDiff;
    if (otherPlanet.y > this.y) {
        yDiff = otherPlanet.y - this.y;
    } else {
        yDiff = this.y - otherPlanet.y;
    }

    var xDiff;
    if (otherPlanet.x > this.x) {
        xDiff = otherPlanet.x - this.x;
    } else {
        xDiff = this.x - otherPlanet.x;
    }

    var distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return distance;
};

Planet.prototype.distanceToCoords = function distanceToCoords(x, y) {
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

Planet.prototype.fleetStepsTo = function fleetStepsTo(otherPlanet) {
    var distance = this.distanceTo(otherPlanet);
    return Math.floor(distance / this._universe.fleetMovementPerStep) + 1;
};

Planet.prototype.getTargetingFleets = function getTargetingFleets() {
    var fleets =  this._universe.getAllFleets();
    var targetingFleets = [];
    for (var i = 0; i < fleets.length; i++) {
        var fl = fleets[i];
        if (fl.destination.equals(this)) targetingFleets.push(fl);
    }
    return targetingFleets;
};

Planet.prototype.getAttackingFleets = function getAttackingFleets() {
    var enemyFleets =  this._universe.getEnemyFleets(this.owner);
    var attackingFleets = [];
    for (var i = 0; i < enemyFleets.length; i++) {
        var fl = enemyFleets[i];
        if (fl.destination.equals(this)) attackingFleets.push(fl);
    }
    return attackingFleets;
};

Planet.prototype.getDefendingFleets = function getDefendingFleets() {
    var myFleets = this._universe.getFleets(this.owner);
    var defendingFleets = [];
    for (var i = 0; i < myFleets.length; i++) {
        var fl = myFleets[i];
        if (fl.destination.equals(this)) defendingFleets.push(fl);
    }
    return defendingFleets;
};

Planet.prototype.isNeutral = function isNeutral() {
    return this.owner.isNeutral;
};

Planet.prototype.sendFleet = function sendFleet(destination, forces) {
    forces = Math.floor(forces);
    if (forces > this.forces) forces = this.forces;
    if (forces <= 0) return;
    this.forces -= forces;
    this._universe.registerFleet(this.id, destination.id, forces);
    return forces;
};