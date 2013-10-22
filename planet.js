Planet: function Planet(universe, owner, recruitingPerStep, centerX, centerY) {
    var fleetMovementPerStep = 10;

    Fleet: function Fleet(universe, flOwner, forces, homePlanet, targetPlanet) {
        if (!homePlanet.ownerEquals(flOwner)) return;

        var fleetId = createId("Fleet:");
        this.getId = function getId() {
            return fleetId;
        };

        this.getMovementPerStep = function getMovementPerStep() {
            return fleetMovementPerStep;
        };

        var fleetOwner = flOwner;
        this.ownerEquals = function ownerEquals(player) {
            return fleetOwner === player;
        };
        var ownerEquals = this.ownerEquals;

        this.isHostileToTarget = function isHostileToTarget() {
            return !targetPlanet.ownerEquals(fleetOwner);
        };
        var isHostileToTarget = this.isHostileToTarget;

        this.isHostileTo = function isHostileTo(fleetOrPlanet) {
            return !fleetOrPlanet.ownerEquals(fleetOwner);
        };
        var isHostileTo = this.isHostileTo;

        var home = homePlanet;
        this.getSource = function getSource() {
            return home;
        };

        var destination = targetPlanet;
        this.getDestination = function getDestination() {
            return destination;
        };

        var fleetForces = forces;
        this.getForces = function getForces() {
            return fleetForces;
        };

        var currentX = homePlanet.getX();
        this.getX = function getX() {
            return currentX;
        };

        var currentY = homePlanet.getY();
        this.getY = function getY() {
            return currentY;
        };

        var step = function step() {
            if (fleetForces != this.getForces()) simulator.alert("getForces of fleet was manipulated!");
            if (currentX != this.getX()) simulator.alert("getX of fleet was manipulated!");
            if (currentY != this.getY()) simulator.alert("getY of fleet was manipulated!");
            if (destination != this.getDestination()) simulator.alert("getDestination of fleet was manipulated!");
            if (home != this.getSource()) simulator.alert("getSource of fleet was manipulated!");
            if (ownerEquals.toString() != this.ownerEquals.toString()) simulator.alert("ownerEquals of fleet was manipulated!");
            if (isHostileTo.toString() != this.isHostileTo.toString()) simulator.alert("isHostileToTarget of fleet was manipulated!");
            if (isHostileToTarget.toString() != this.isHostileToTarget.toString()) simulator.alert("isHostileToTarget of fleet was manipulated!");
            if (fleetMovementPerStep != this.getMovementPerStep()) simulator.alert("getMovementPerStep of fleet was manipulated!");
            if (fleetId != this.getId()) simulator.alert("getId of fleet was manipulated!");

            var distance = this.distanceToPos(this.getDestination().getX(), this.getDestination().getY());
            if (distance <= this.getMovementPerStep()) {
                // attack / defend
                targetPlanet.enteredBy(this, fleetOwner);
            } else {
                // update position
                var remainingSteps = Math.floor(distance / this.getMovementPerStep());

                var xDiff = this.getDestination().getX() - currentX;
                var yDiff = this.getDestination().getY() - currentY;

                currentX += xDiff / remainingSteps;
                currentY += yDiff / remainingSteps;
            }
        }.bind(this);

        this.exportState = function exportState() {
            var steps = this.stepsToTarget();
            var frontX = currentX + (this.getDestination().getX() - currentX) / steps;
            var frontY = currentY + (this.getDestination().getY() - currentY) / steps;

            var diffX = frontX - currentX;
            var diffY = frontY - currentY;

            var backX = currentX - diffX;
            var backY = currentY - diffY;

            var backRightX = backX - 1/2 * diffY;
            var backRightY = backY + 1/2 * diffX;

            var backLeftX = backX + 1/2 * diffY;
            var backLeftY = backY - 1/2 * diffX;

            var exportedFleet = {
                "forces": fleetForces,
                "x": currentX,
                "y": currentY,
                "backRightX": backRightX,
                "backRightY": backRightY,
                "backLeftX": backLeftX,
                "backLeftY": backLeftY
            };
            return exportedFleet;
        };

        universe.registerFleet(this, step);
    };

    Fleet.prototype.distanceToPos = function distanceToPos(x, y) {
        var yDiff;
        if (y > this.getY()) {
            yDiff = y - this.getY();
        } else {
            yDiff = this.getY() - y;
        }

        var xDiff;
        if (x > this.getX()) {
            xDiff = x - this.getX();
        } else {
            xDiff = this.getX() - x;
        }

        var distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
        return distance;
    };

    Fleet.prototype.distanceToTarget = function distanceToTarget() {
        return this.distanceToPos(this.getDestination().getX(), this.getDestination().getY());
    };

    Fleet.prototype.stepsToTarget = function stepsToTarget() {
        var distance = this.distanceToTarget();
        return Math.floor(distance / this.getMovementPerStep());
    };

    this.isFleetOrigin = function isFleetOrigin(fleet) {
        return fleet instanceof Fleet;
    };

    //------------------------------------------------------------------

    var id = createId("Planet:");
    var setGetId = function setGetId(planetId) {
        this.getId = function getId() {
            return planetId;
        };
    }.bind(this);
    setGetId(id);

    var planetOwner = owner;

    var setOwnerEquals = function setOwnerEquals(plOwner) {
        this.ownerEquals = function ownerEquals(player) {
            return plOwner === player;
        };
    }.bind(this);
    setOwnerEquals(planetOwner);
    var ownerEquals = this.ownerEquals;

    var deregisterPlanet = function deregisterPlanet() {
        planetOwner.deregisterPlanet(this);
        var id = createId("Planet:");
        setGetId(id);
    }.bind(this);

    var setIsNeutral = function setIsNeutral(plOwner) {
        this.isNeutral = function isNeutral() {
            return plOwner.isNeutral;
        };
    }.bind(this);
    setIsNeutral(planetOwner);

    var recruiting = recruitingPerStep;
    this.getRecruitingPerStep = function getRecruitingPerStep() {
        return recruiting;
    };

    var x = centerX;
    this.getX = function getX() {
        return x;
    };

    var y = centerY;
    this.getY = function getY() {
        return y;
    };

    this.radius = recruitingPerStep * 5;

    var groundForces = 5 * this.getRecruitingPerStep();
    this.getForces = function getForces() {
        return groundForces;
    };

    var cosmos = universe;
    var registerPlanet = function registerPlnaet(plOwner) {
        var sendFleet = function sendFleet(size, destination) {
            if (size > groundForces || size < 0) return;
            var fleetSize = Math.floor(size);
            new Fleet(cosmos, plOwner, fleetSize, this, destination);
            groundForces -= fleetSize;
        }.bind(this);
        plOwner.registerPlanet(this, sendFleet);
    }.bind(this);
    registerPlanet(planetOwner);

    var setGetDefendingFleets = function setGetDefendingFleets(plOwner) {
        this.getDefendingFleets = function getDefendingFleets() {
            var myFleets = cosmos.getFleets(plOwner);
            var defendingFleets = [];
            for (var i = 0; i < myFleets.length; i++) {
                var fl = myFleets[i];
                if (fl.getDestination() === this) defendingFleets.push(fl);
            }
            return defendingFleets;
        };
    }.bind(this);

    var setGetAttackingFleets = function setAttackingFleets(plOwner) {
        this.getAttackingFleets = function getAttackingFleets() {
            var enemyFleets =  cosmos.getEnemyFleets(plOwner);
            var attackingFleets = [];
            for (var i = 0; i < enemyFleets.length; i++) {
                var fl = enemyFleets[i];
                if (fl.getDestination() === this) attackingFleets.push(fl);
            }
            return attackingFleets;
        }
    }.bind(this);

    var setGetTargetingFleets = function setTargetingFleets(plOwner) {
        this.getTargetingFleets = function getTargetingFleets() {
            var enemyFleets =  cosmos.getAllFleets();
            var fleets = [];
            for (var i = 0; i < enemyFleets.length; i++) {
                var fl = enemyFleets[i];
                if (fl.getDestination() === this) fleets.push(fl);
            }
            return fleets;
        }
    }.bind(this);

    setGetDefendingFleets(planetOwner);
    setGetAttackingFleets(planetOwner);
    setGetTargetingFleets(planetOwner);


    this.enteredBy = function enteredBy(fleet, owner) {
        if (!fleet.ownerEquals(owner)) return;

        var source = fleet.getSource();
        if (!cosmos.knowsPlanet(source)) return;
        if (!(source.isFleetOrigin(fleet))) return;

        cosmos.deregisterFleet(fleet);

        if (this.ownerEquals(owner)) {
            groundForces += fleet.getForces();
        } else {
            if (fleet.getForces() >= groundForces) {

                deregisterPlanet();
                var planetOwner = owner;
                deregisterPlanet = function deregisterPlanet() {
                    planetOwner.deregisterPlanet(this);
                    var id = createId("Planet:");
                    setGetId(id);
                }.bind(this);

                setOwnerEquals(planetOwner);
                setIsNeutral(planetOwner);
                groundForces = fleet.getForces() - groundForces;
                setGetDefendingFleets(planetOwner);
                setGetAttackingFleets(planetOwner);
                setGetTargetingFleets(planetOwner);
                registerPlanet(planetOwner);

            } else {
                groundForces -= fleet.getForces();
            }
        }
    }.bind(this);

    this.fleetStepsTo = function fleetStepsTo(otherPlanet) {
        var distance = this.distanceTo(otherPlanet);
        return Math.floor(distance / fleetMovementPerStep);
    };

    var isFleetOrigin = this.isFleetOrigin;
    var step = function step() {
        if (this.isNeutral()) return;
        groundForces += this.getRecruitingPerStep();
        if (recruitingPerStep != this.getRecruitingPerStep()) simulator.alert("getRecruitingPerStep of planet was manipulated!");
        if (groundForces != this.getForces()) simulator.alert("getForces of planet was manipulated!");
        if (x != this.getX()) simulator.alert("getX of planet was manipulated!");
        if (y != this.getY()) simulator.alert("getY planet was manipulated!");
        if (isFleetOrigin.toString() != this.isFleetOrigin.toString()) simulator.alert("isFleetOrigin of planet was manipulated!");
        if (ownerEquals.toString() != this.ownerEquals.toString()) simulator.alert("ownerEquals of planet was manipulated!");
    }.bind(this);

    this.exportState = function exportState() {
        var exportedPlanet = {
            "forces": groundForces,
            "x": x,
            "y": y,
            "radius": this.radius
        };
        return exportedPlanet;
    };

    universe.registerPlanetStepFunction(step);
};


// uses center coordinates
Planet.prototype.distanceTo = function distanceTo(otherPlanet) {
    var yDiff;
    if (otherPlanet.getY() > this.getY()) {
        yDiff = otherPlanet.getY() - this.getY();
    } else {
        yDiff = this.getY() - otherPlanet.getY();
    }

    var xDiff;
    if (otherPlanet.getX() > this.getX()) {
        xDiff = otherPlanet.getX() - this.getX();
    } else {
        xDiff = this.getX() - otherPlanet.getX();
    }

    var distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return distance;
};

Planet.prototype.minDistanceToOther = 5;
Planet.prototype.collidesWith = function collidesWith(otherPlanet) {
    var distance = this.distanceTo(otherPlanet);
    if (distance - this.minDistanceToOther > this.radius + otherPlanet.radius) return false;
    return true;
};

Planet.prototype.margin = 10;
Planet.prototype.fullyVisibleIn = function fullyVisibleIn(canvasWidth, canvasHeight) {
    if (this.getX() - this.radius < this.margin) return false;
    if (this.getY() - this.radius < this.margin) return false;
    if (this.getX() + this.radius >= canvasWidth - this.margin) return false;
    if (this.getY() + this.radius >= canvasHeight - this.margin) return false;
    return true;
};