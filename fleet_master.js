Fleet: function Fleet(forces, sourcePlanet, destinationPlanet, movementPerStep) {
    this.id = createId("Fleet:");
    this.owner = sourcePlanet.owner;
    this.forces = forces;
    this.source = sourcePlanet;
    this.destination = destinationPlanet;
    this.movementPerStep = movementPerStep;

    this.currentX = sourcePlanet.x;
    this.currentY = sourcePlanet.y;
};

Fleet.prototype.step = function step() {
    var distance = this.distanceToPos(this.destination.x, this.destination.y);
    if (distance <= this.movementPerStep) {
        // attack / defend
        this.destination.enteredBy(this);

    } else {
        // update position
        var remainingSteps = Math.floor(distance / this.movementPerStep);

        var xDiff = this.destination.x - this.currentX;
        var yDiff = this.destination.y - this.currentY;

        this.currentX += xDiff / remainingSteps;
        this.currentY += yDiff / remainingSteps;
    }
};

Fleet.prototype.distanceToPos = function distanceToPos(x, y) {
    var yDiff;
    if (y > this.currentY) {
        yDiff = y - this.currentY;
    } else {
        yDiff = this.currentY - y;
    }

    var xDiff;
    if (x > this.currentX) {
        xDiff = x - this.currentX;
    } else {
        xDiff = this.currentX - x;
    }

    var distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return distance;
};

Fleet.prototype.distanceToDestination = function distanceToDestination() {
    return this.distanceToPos(this.destination.x, this.destination.y);
};

Fleet.prototype.stepsToDestination = function stepsToDestination() {
    var distance = this.distanceToDestination();
    return Math.floor(distance / this.movementPerStep) + 1;
};

Fleet.prototype.toJSON = function toJSON() {
    var steps = this.stepsToDestination();
    var frontX = this.currentX + (this.destination.x - this.currentX) / steps;
    var frontY = this.currentY + (this.destination.y - this.currentY) / steps;

    var diffX = frontX - this.currentX;
    var diffY = frontY - this.currentY;

    var backX = this.currentX - diffX;
    var backY = this.currentY - diffY;

    var backRightX = backX - 1/2 * diffY;
    var backRightY = backY + 1/2 * diffX;

    var backLeftX = backX + 1/2 * diffY;
    var backLeftY = backY - 1/2 * diffX;

    return {
        "id": this.id,
        "source": this.source.toJSON(),
        "destination": this.destination.toJSON(),
        "owner": this.owner,
        "forces": this.forces,
        "x": this.currentX,
        "y": this.currentY,
        "movementPerStep": this.movementPerStep,
        "backRightX": backRightX,
        "backRightY": backRightY,
        "backLeftX": backLeftX,
        "backLeftY": backLeftY
    }
};