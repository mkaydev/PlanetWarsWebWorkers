Planet: function Planet(universe, owner, recruitingPerStep, centerX, centerY, initialForces) {
    this.id = createId("Planet:");
    this.universe = universe;
    this.owner = owner;
    this.recruitingPerStep = recruitingPerStep;
    this.x = centerX;
    this.y = centerY;
    this.radius = Math.sqrt(recruitingPerStep * 2) * 5;
    this.forces = 5 * this.recruitingPerStep;
    if (typeof initialForces !== "undefined") this.forces = initialForces;
};

Planet.prototype.step = function step() {
    if (this.owner.isNeutral) return;
    this.forces += this.recruitingPerStep;
};

Planet.prototype.enteredBy = function enteredBy(fleet) {
    if (this.owner.id === fleet.owner.id) {
        this.forces += fleet.forces;
    } else {
        if (fleet.forces >= this.forces) {
            this.owner = fleet.owner;
            this.forces = fleet.forces - this.forces;
        } else {
            this.forces -= fleet.forces;
        }
    }
    this.universe.deregisterFleet(fleet);
};

// uses center coordinates
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

Planet.prototype.minDistanceToOther = 5;
Planet.prototype.collidesWith = function collidesWith(otherPlanet, minDistance) {
    var distance = this.distanceTo(otherPlanet);
    if (typeof minDistance !== "undefined") {
        if (distance - minDistance > this.radius + otherPlanet.radius) return false;
        return true;
    } else {
        if (distance - this.minDistanceToOther > this.radius + otherPlanet.radius) return false;
        return true;
    }
};

Planet.prototype.margin = 10;
Planet.prototype.fullyVisibleIn = function fullyVisibleIn(canvasWidth, canvasHeight) {
    if (this.x - this.radius < this.margin) return false;
    if (this.y - this.radius < this.margin) return false;
    if (this.x + this.radius >= canvasWidth - this.margin) return false;
    if (this.y + this.radius >= canvasHeight - this.margin) return false;
    return true;
};

Planet.prototype.toJSON = function toJSON() {
    return {
        "id": this.id,
        "owner": this.owner,
        "x": this.x,
        "y": this.y,
        "radius": this.radius,
        "forces": this.forces,
        "recruitingPerStep": this.recruitingPerStep
    };
};