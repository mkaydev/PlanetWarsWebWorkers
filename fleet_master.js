Fleet: function Fleet(forces, sourcePlanet, destinationPlanet, movementPerStep) {
    this[_STATE_KEYS["id"]] = createId();
    this[_STATE_KEYS["owner"]] = sourcePlanet.getOwner();
    this[_STATE_KEYS["forces"]] = forces;
    this[_STATE_KEYS["source"]] = sourcePlanet;
    this[_STATE_KEYS["destination"]] = destinationPlanet;
    this[_STATE_KEYS["movementPerStep"]] = movementPerStep;

    this[_STATE_KEYS["x"]] = sourcePlanet.getX();
    this[_STATE_KEYS["y"]] = sourcePlanet.getY();
};

Fleet.prototype.getId = function getId() {
    return this[_STATE_KEYS["id"]];
};

Fleet.prototype.getOwner = function getOwner() {
    return this[_STATE_KEYS["owner"]];
};

Fleet.prototype.getForces = function getForces() {
    return this[_STATE_KEYS["forces"]];
};

Fleet.prototype.getSource = function getSource() {
    return this[_STATE_KEYS["source"]];
};

Fleet.prototype.getDestination = function getDestination() {
    return this[_STATE_KEYS["destination"]];
};

Fleet.prototype.getMovementPerStep = function getMovementPerStep() {
    return this[_STATE_KEYS["movementPerStep"]];
};

Fleet.prototype.getX = function getX() {
    return this[_STATE_KEYS["x"]];
};

Fleet.prototype.setX = function setX(x) {
    this[_STATE_KEYS["x"]] = x;
};

Fleet.prototype.setY = function setY(y) {
    this[_STATE_KEYS["y"]] = y;
};

Fleet.prototype.getY = function getY() {
    return this[_STATE_KEYS["y"]];
};

Fleet.prototype.step = function step() {
    var myX, myY, remainingSteps, xDiff, yDiff, movementPerStep, destination, destX, destY, distance;
    movementPerStep = this.getMovementPerStep();
    destination = this.getDestination();
    destX = destination.getX();
    destY = destination.getY();
    distance = this.distanceToPos(destX, destY);

    if (distance <= movementPerStep) {
        // attack / defend
        destination.enteredBy(this);

    } else {
        myX = this.getX();
        myY = this.getY();

        // update position
        remainingSteps = Math.floor(distance / movementPerStep);

        xDiff = destX - myX;
        yDiff = destY - myY;

        this.setX(myX + xDiff / remainingSteps);
        this.setY(myY + yDiff / remainingSteps);
    }
};

Fleet.prototype.distanceToPos = function distanceToPos(x, y) {
    var yDiff, xDiff, distance, myY, myX;
    myY = this.getY();
    myX = this.getX();

    if (y > myY) {
        yDiff = y - myY;
    } else {
        yDiff = myY - y;
    }

    if (x > myX) {
        xDiff = x - myX;
    } else {
        xDiff = myX - x;
    }

    distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return distance;
};

Fleet.prototype.distanceToDestination = function distanceToDestination() {
    var destination = this.getDestination();
    return this.distanceToPos(destination.getX(), destination.getY());
};

Fleet.prototype.stepsToDestination = function stepsToDestination() {
    var distance = this.distanceToDestination();
    return Math.floor(distance / this.getMovementPerStep()) + 1;
};

Fleet.prototype.toJSON = function toJSON() {
    var steps,
        destination,
        x,
        y,
        frontX,
        frontY,
        diffX,
        diffY,
        backX,
        backY,
        backRightX,
        backRightY,
        backLeftX,
        backLeftY,
        json;

    steps = this.stepsToDestination();
    destination = this.getDestination();
    x = this.getX();
    y = this.getY();
    frontX = x + (destination.getX() - x) / steps;
    frontY = y + (destination.getY() - y) / steps;
    diffX = frontX - x;
    diffY = frontY - y;
    backX = x - diffX;
    backY = y - diffY;
    backRightX = backX - 1 / 2 * diffY;
    backRightY = backY + 1 / 2 * diffX;
    backLeftX = backX + 1 / 2 * diffY;
    backLeftY = backY - 1 / 2 * diffX;
    json = {};

    json[_STATE_KEYS["id"]] = this.getId();
    json[_STATE_KEYS["sourceId"]] = this.getSource().getId();
    json[_STATE_KEYS["destinationId"]] = destination.getId();
    json[_STATE_KEYS["ownerId"]] = this.getOwner().id;
    json[_STATE_KEYS["forces"]] = this.getForces();
    json[_STATE_KEYS["x"]] = x;
    json[_STATE_KEYS["y"]] = y;
    json[_STATE_KEYS["movementPerStep"]] = this.getMovementPerStep();
    json[_STATE_KEYS["backRightX"]] = backRightX;
    json[_STATE_KEYS["backRightY"]] = backRightY;
    json[_STATE_KEYS["backLeftX"]] = backLeftX;
    json[_STATE_KEYS["backLeftY"]] = backLeftY;
    return json;
};