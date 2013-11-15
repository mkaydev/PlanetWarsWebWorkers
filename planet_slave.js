Planet: function Planet(planetState, universe) {
    this._universe = universe;
    this._setState(planetState);
};

Planet.prototype._setState = function _setState(planetState) {
    this._fleetCache = {};
    this._planetCache = {};
    this._state = planetState;
};

Planet.prototype.getOwner = function getOwner() {
    return this._universe._getPlayer(this._state[_STATE_KEYS["ownerId"]]);
};

Planet.prototype.getX = function getX() {
    return this._state[_STATE_KEYS["x"]];
};

Planet.prototype.getY = function getY() {
    return this._state[_STATE_KEYS["y"]];
};

Planet.prototype.getId = function getId() {
    return this._state[_STATE_KEYS["id"]];
};

Planet.prototype.getForces = function getForces() {
    return this._state[_STATE_KEYS["forces"]];
};

Planet.prototype.getRecruitingPerStep = function getRecruitingPerStep() {
    return this._state[_STATE_KEYS["recruitingPerStep"]];
};

Planet.prototype._setForces = function _setForces(forces) {
    this._state[_STATE_KEYS["forces"]] = forces;
};

Planet.prototype.equals = function equals(otherPlanet) {
    return this.getId() == otherPlanet.getId();
};

Planet.prototype.ownerEquals = function ownerEquals(player) {
    return this.getOwner().equals(player);
};

Planet.prototype.distanceTo = function distanceTo(otherPlanet) {
    var id;
    id = otherPlanet.getId();
    if (!this._planetCache.hasOwnProperty(id)) {
        this._planetCache[id] = this.distanceToCoords(otherPlanet.getX(), otherPlanet.getY());
    }
    return this._planetCache[id];
};

Planet.prototype.distanceToCoords = function distanceToCoords(x, y) {
    var yDiff,
        xDiff,
        distance,
        planetX = this.getX(),
        planetY = this.getY();

    if (y > planetY) {
        yDiff = y - planetY;
    } else {
        yDiff = planetY - y;
    }

    if (x > planetX) {
        xDiff = x - planetX;
    } else {
        xDiff = planetX - x;
    }

    distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return distance;
};

Planet.prototype.fleetStepsTo = function fleetStepsTo(otherPlanet) {
    var distance = this.distanceTo(otherPlanet);
    return Math.floor(distance / this._universe.fleetMovementPerStep) + 1;
};

Planet.prototype.getTargetingFleets = function getTargetingFleets() {
    var targeting1,
        targeting2;

    targeting1 = this.getAttackingFleets();
    targeting2 = this.getDefendingFleets();

    targeting1.push.apply(targeting1, targeting2);
    return targeting1;
};

Planet.prototype.getAttackingFleets = function getAttackingFleets() {
    var i,
        fl,
        enemyFleets,
        attackingFleets;

    if (!this._fleetCache.hasOwnProperty(_STATE_KEYS["attackedBy"])) {
        attackingFleets =  [];
        enemyFleets =  this._universe.getEnemyFleets(this.getOwner());

        for (i = 0; fl = enemyFleets[i]; ++i) {
            if (fl.getDestination().equals(this)) attackingFleets.push(fl);
        }
        this._fleetCache[_STATE_KEYS["attackedBy"]] = attackingFleets;
    }

    attackingFleets = this._fleetCache[_STATE_KEYS["attackedBy"]];
    return attackingFleets.slice();
};

Planet.prototype.getDefendingFleets = function getDefendingFleets() {
    var i,
        fl,
        myFleets,
        defendingFleets;

    if (!this._fleetCache.hasOwnProperty(_STATE_KEYS["defendedBy"])) {
        myFleets =  this._universe.getFleets(this.getOwner());
        defendingFleets = [];

        for (i = 0; fl = myFleets[i]; ++i) {
            if (fl.getDestination().equals(this)) defendingFleets.push(fl);
        }

        this._fleetCache[_STATE_KEYS["defendedBy"]] = defendingFleets;
    }

    defendingFleets = this._fleetCache[_STATE_KEYS["defendedBy"]];
    return defendingFleets.slice();
};

Planet.prototype.isNeutral = function isNeutral() {
    return this.getOwner().isNeutral;
};

Planet.prototype.sendFleet = function sendFleet(destination, forces) {
    var planetForces = this.getForces();
    forces = Math.floor(forces);

    if (forces > planetForces) forces = planetForces;
    if (forces <= 0) return;

    this._setForces(planetForces - forces);
    this._universe.registerFleet(this.getId(), destination.getId(), forces);
    return forces;
};