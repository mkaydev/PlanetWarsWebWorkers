Planet: function Planet(universe, owner, recruitingPerStep, centerX, centerY, initialForces) {
    this[_STATE_KEYS["universe"]] = universe;
    this[_STATE_KEYS["id"]] = createId();
    this[_STATE_KEYS["owner"]] = owner;
    this[_STATE_KEYS["recruitingPerStep"]] = recruitingPerStep;
    this[_STATE_KEYS["x"]] = centerX;
    this[_STATE_KEYS["y"]] = centerY;
    this[_STATE_KEYS["radius"]] = Math.sqrt(recruitingPerStep * 2) * 5;
    this[_STATE_KEYS["forces"]] = 5 * this.getRecruitingPerStep();
    if (typeof initialForces !== "undefined") this.setForces(initialForces);
};

Planet.prototype.getUniverse = function getUniverse() {
    return this[_STATE_KEYS["universe"]];
};

Planet.prototype.getOwner = function getOwner() {
    return this[_STATE_KEYS["owner"]];
};

Planet.prototype.setOwner = function setOwner(owner) {
    this[_STATE_KEYS["owner"]] = owner;
};

Planet.prototype.getX = function getX() {
    return this[_STATE_KEYS["x"]];
};

Planet.prototype.getY = function getY() {
    return this[_STATE_KEYS["y"]];
};

Planet.prototype.getId = function getId() {
    return this[_STATE_KEYS["id"]];
};

Planet.prototype.getForces = function getForces() {
    return this[_STATE_KEYS["forces"]];
};

Planet.prototype.setForces = function _setForces(forces) {
    this[_STATE_KEYS["forces"]] = forces;
};

Planet.prototype.getRadius = function getRadius() {
    return this[_STATE_KEYS["radius"]];
}

Planet.prototype.getRecruitingPerStep = function getRecruitingPerStep() {
    return this[_STATE_KEYS["recruitingPerStep"]];
};


Planet.prototype.step = function step() {
    if (this.getOwner().isNeutral) return;
    this.setForces(this.getForces() + this.getRecruitingPerStep());
};

Planet.prototype.enteredBy = function enteredBy(fleet) {
    var planetForces = this.getForces(),
        fleetForces = fleet.getForces(),
        fleetOwner = fleet.getOwner();

    if (this.getOwner().id == fleetOwner.id) {
        this.setForces(planetForces + fleetForces);
    } else {
        if (fleetForces >= planetForces) {
            this.setOwner(fleetOwner);
            this.setForces(fleetForces - planetForces);
        } else {
            this.setForces(planetForces - fleetForces);
        }
    }
    this.getUniverse().deregisterFleet(fleet);
};

// uses center coordinates
Planet.prototype.distanceTo = function distanceTo(otherPlanet) {
    return this.distanceToCoords(otherPlanet.getX(), otherPlanet.getY());
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

Planet.prototype.minDistanceToOther = 5;
Planet.prototype.collidesWith = function collidesWith(otherPlanet, minDistance) {
    var distance = this.distanceTo(otherPlanet);
    if (typeof minDistance !== "undefined") {
        if (distance - minDistance > this.getRadius() + otherPlanet.getRadius()) return false;
        return true;
    } else {
        if (distance - this.minDistanceToOther > this.getRadius() + otherPlanet.getRadius()) return false;
        return true;
    }
};

Planet.prototype.margin = 10;
Planet.prototype.fullyVisibleIn = function fullyVisibleIn(canvasWidth, canvasHeight) {
    var r, x, y, margin;
    r = this.getRadius();
    x = this.getX();
    y = this.getY();
    margin = this.margin;

    if (x - r < margin) return false;
    if (y - r < margin) return false;
    if (x + r >= canvasWidth - margin) return false;
    if (y + r >= canvasHeight - margin) return false;
    return true;
};

Planet.prototype.toJSON = function toJSON() {
    var json = {};
    json[_STATE_KEYS["id"]] = this.getId();
    json[_STATE_KEYS["ownerId"]] = this.getOwner().id;
    json[_STATE_KEYS["x"]] = this.getX()
    json[_STATE_KEYS["y"]] = this.getY();
    json[_STATE_KEYS["radius"]] = this.getRadius();
    json[_STATE_KEYS["forces"]] = this.getForces();
    json[_STATE_KEYS["recruitingPerStep"]] = this.getRecruitingPerStep();
    return json;
};