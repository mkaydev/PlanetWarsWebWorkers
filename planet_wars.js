createId: function createId(prefix) {
    if (typeof prefix === "undefined") prefix = "";
    return "".concat(prefix, Math.random(),  new Date().getTime());
}

shuffleArray: function shuffleArray(arr) {
    for (var i = 0; i < arr.length - 1; i++) {
        var switchIndex = Math.floor(Math.random() * arr.length);
        var tmp = arr[i];
        arr[i] = arr[switchIndex];
        arr[switchIndex] = tmp;
    }
};

// -------------------------------------------------------------
Player: function Player() {
    this.color = "white";
};
Player.prototype.isNeutral = false;
Player.prototype.think = function think(universe) {};

Player.prototype.sendFleet = function sendFleet(source, destination, fleetSize) {
    if (isNaN(fleetSize)) return;
    if (typeof destination === "undefined") return;
    if (typeof source === "undefined") return;
    if (source.ownerEquals(this) && source.getForces() > 0 && source != destination) {
        var size = fleetSize;
        if (size > source.getForces()) size = source.getForces();
        source.sendFleet(size, destination);
    }
};

NeutralPlayer: function NeutralPlayer() {
    this.color = "grey";
};
NeutralPlayer.prototype = new Player();
NeutralPlayer.prototype.constructor = NeutralPlayer;
NeutralPlayer.prototype.isNeutral = true;

// ---------------------------------------------------------------------------------------------------------------------------------

Planet: function Planet(universe, owner, recruitingPerStep, centerX, centerY) {
    Fleet: function Fleet(universe, flOwner, forces, homePlanet, targetPlanet) {
        if (!homePlanet.ownerEquals(flOwner)) return;

        var fleetId = createId("Fleet:");
        this.getId = function getId() {
            return fleetId;
        };

        var movementPerStep = 10;
        this.getMovementPerStep = function getMovementPerStep() {
            return movementPerStep;
        };

        var fleetOwner = flOwner;
        this.ownerEquals = function ownerEquals(player) {
            return fleetOwner === player;
        };

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


    var planetOwner = owner;

    var setOwnerEquals = function setOwnerEquals(plOwner) {
        this.ownerEquals = function ownerEquals(player) {
            return plOwner === player;
        };
    }.bind(this);
    setOwnerEquals(planetOwner);

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

    this.radius = recruitingPerStep * 5; // assumes integer

    var groundForces = 5 * this.getRecruitingPerStep();
    this.getForces = function getForces() {
        return groundForces;
    };

    var cosmos = universe;
    var setSendFleet = function setSendFleet(plOwner) {
        this.sendFleet = function sendFleet(size, destination) {
            if (size > groundForces) return;
            new Fleet(cosmos, plOwner, size, this, destination);
            groundForces -= size;
        }.bind(this);
    }.bind(this);
    setSendFleet(planetOwner);

    this.enteredBy = function enteredBy(fleet, owner) {
        if (!fleet.ownerEquals(owner)) return;
        
        var source = fleet.getSource();
        if (!(source instanceof Planet)) return;
        if (!cosmos.knowsPlanet(source)) return;
        if (!(source.isFleetOrigin(fleet))) return;
        
        cosmos.unregisterFleet(fleet);

        if (this.ownerEquals(owner)) {
            groundForces += fleet.getForces();
        } else {
            if (fleet.getForces() > groundForces) {

                var planetOwner = owner;
                setOwnerEquals(planetOwner);
                setSendFleet(planetOwner);
                setIsNeutral(planetOwner);
                groundForces = fleet.getForces() - groundForces;
            } else {
                groundForces -= fleet.getForces();
            }
        }
    }.bind(this);

    var step = function step() {
        if (this.isNeutral()) return;
        groundForces += this.getRecruitingPerStep();
    }.bind(this);

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

Planet.prototype.fullyVisibleIn = function fullyVisibleIn(canvasWidth, canvasHeight) {
    if (this.getX() - this.radius < 0) return false;
    if (this.getY() - this.radius < 0) return false;
    if (this.getX() + this.radius >= canvasWidth) return false;
    if (this.getY() + this.radius >= canvasHeight) return false;
    return true;
};

// ---------------------------------------------------------------------------------------------------------------------------------

Universe: function Universe(initialPlayers, neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId) {
    var players = initialPlayers;
    this.determineActivePlayers = function determineActivePlayers() {
        var activePlayers = [];

        for (var i = 0; i < players.length; i++) {
            var planetCount = this.getPlanets(players[i]).length;
            var fleetCount = this.getFleets(players[i]).length;
            if (planetCount + fleetCount > 0) activePlayers.push(players[i]);
        }

        return activePlayers;
    };

    var neutralPlayer = new NeutralPlayer();
    this.getNeutralPlayer = function getNeutralPlayer() {
        return neutralPlayer;
    };
    this.foregroundCanvasId = foregroundCanvasId;
    this.foregroundCanvas = document.getElementById(this.foregroundCanvasId);
    this.backgroundCanvasId = backgroundCanvasId;
    this.backgroundCanvas = document.getElementById(this.backgroundCanvasId);

    this.width = width;
    this.height = height;
    $("#" + foregroundCanvasId).attr("width", this.width);
    $("#" + foregroundCanvasId).attr("height", this.height);
    $("#" + backgroundCanvasId).attr("width", this.width);
    $("#" + backgroundCanvasId).attr("height", this.height);

    var context = this.backgroundCanvas.getContext("2d");
    context.fillStyle = "black";
    context.fillRect(0, 0, this.width, this.height)

    var planetStepFuncs = [];
    this.registerPlanetStepFunction = function registerPlanetStepFunction(stepFunc) {
        planetStepFuncs.push(stepFunc);
    };

    // create main planets for players
    var planets = [];

    this.createNewPlanet = function createNewPlanet(recruitingPerStep, owner) {
        var collides = true;
        while (collides) {
            var coords;
            var planet;
            var fullyVisible = false;

            while (!fullyVisible) {
                coords = this.getNewPlanetCoords();
                planet = new Planet(this, owner, recruitingPerStep, coords.x, coords.y);
                fullyVisible = planet.fullyVisibleIn(this.width, this.height);
            }

            collides = false;
            for (var i = 0; i < planets.length; i++) {
                if (planets[i].collidesWith(planet)) {
                    collides = true;
                    break;
                }
            }
            if (!collides) return planet;
        }
    }.bind(this);

    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        var planet = this.createNewPlanet(this.mainPlanetRecruitingPerStep, player);
        planets.push(planet);
    }

    // create neutral planets
    for (var i = 0; i < neutralPlanetCount; i++) {
        var recruiting = Math.round((this.maxSecondaryPlanetRecruitingPerStep - this.minSecondaryPlanetRecrutingPerStep) * Math.random()) + this.minSecondaryPlanetRecrutingPerStep;
        var planet = this.createNewPlanet(recruiting, this.getNeutralPlayer());
        planets.push(planet);
    }

    shuffleArray(planets);
    this.getAllPlanets = function getAllPlanets() {
        return planets.slice();
    };

    this.knowsPlanet = function knowsPlanet(p) {
        for (var i = 0; i < planets.length; i++) {
            if (planets[i] === p) return true;
        }
        return false;
    };

    var activePlayers = players.slice();
    shuffleArray(activePlayers);
    this.getActivePlayers = function getActivePlayers() {
        return activePlayers.slice();
    };

    var fleets = {};
    var fleetStepFuncs = {};

    this.getAllFleets = function getAllFleets() {
        var fleetsAsArray = $.map(fleets, function(k, v) {
            return [k];
        });
        return fleetsAsArray;
    };

    this.registerFleet = function registerFleet(fleet, stepFunc) {
        var flightId = fleet.getId();
        if (fleets.hasOwnProperty(flightId)) console.log(flightId);
        fleets[flightId] = fleet;
        fleetStepFuncs[flightId] = stepFunc;

    };

    this.unregisterFleet = function unregisterFleet(fleet) {
        var flightId = fleet.getId();
        delete fleets[flightId];
        delete fleetStepFuncs[flightId];
    };

    this.step = function step() {
        for (var fleetId in fleetStepFuncs) {
            fleetStepFuncs[fleetId]();
        }

        for (var i = 0; i < planetStepFuncs.length; i++) {
            planetStepFuncs[i]();
        }

        for (var i = 0; i < this.getActivePlayers().length; i++) {
            this.getActivePlayers()[i].think(this);
        }

        var activePlayers = this.determineActivePlayers();
        shuffleArray(activePlayers);
        this.getActivePlayers = function getActivePlayers() {
            return activePlayers.slice();
        };
    }.bind(this);
};
Universe.prototype.mainPlanetRecruitingPerStep = 6;
Universe.prototype.maxSecondaryPlanetRecruitingPerStep = 4;
Universe.prototype.minSecondaryPlanetRecrutingPerStep = 1;

Universe.prototype.getNewPlanetCoords = function getNewPlanetCoords() {
    var x = Math.round(this.width * Math.random());
    var y = Math.round(this.height * Math.random());
    return {"x": x, "y": y};
};

Universe.prototype.getFleets = function getFleets(player) {
    var fleetsAsArray = this.getAllFleets();
    var myFleets = [];
    for (var i = 0; i < fleetsAsArray.length; i++) {
        if (fleetsAsArray[i].ownerEquals(player)) myFleets.push(fleetsAsArray[i]);
    }
    return myFleets;
};

Universe.prototype.getEnemyFleets = function getEnemyFleets(player) {
    var fleetsAsArray = this.getAllFleets();
    var enemyFleets = [];
    for (var i = 0; i < fleetsAsArray.length; i++) {
        if (!fleetsAsArray[i].ownerEquals(player)) enemyFleets.push(fleetsAsArray[i]);
    }
    return enemyFleets;
};

Universe.prototype.getPlanets = function getPlanets(player) {
    var all = this.getAllPlanets();
    var planets = [];
    for (var i = 0; i < all.length; i++) {
        if (all[i].ownerEquals(player)) planets.push(all[i]);
    }
    return planets;
};
Universe.prototype.getNeutralPlanets = function getNeutralPlanets() {
    var all = this.getAllPlanets();
    var planets = [];
    for (var i = 0; i < all.length; i++) {
        if (all[i].ownerEquals(this.getNeutralPlayer())) planets.push(all[i]);
    }
    return planets;
};

Universe.prototype.getEnemyPlanets = function getEnemyPlanets(player) {
    var all = this.getAllPlanets();
    var planets = [];
    for (var i = 0; i < all.length; i++) {
        if (!all[i].ownerEquals(player)) planets.push(all[i]);
    }
    return planets;
};

Universe.prototype.getNearest = function getNearest(planet, planets) {
    if (planets.length === 0) return;
    var curMinDist = Infinity;
    var curPlanet;

    for (var i = 0; i < planets.length; i++) {
        var dist = planet.distanceTo(planets[i]);
        if (dist < curMinDist) {
            curMinDist = dist;
            curPlanet = planets[i];
        }
    };

    return curPlanet;
};

Universe.prototype.getGroundForces = function getGroundForces(player) {
    var planets = this.getPlanets(player);
    var groundForce = 0;
    for (var i = 0; i < planets.length; i++) {
        groundForce += planets[i].getForces();
    }
    return groundForce;
};

Universe.prototype.getAirForces = function getAirForces(player) {
    var fleets = this.getFleets(player);
    var airForce = 0;
    for (var i = 0; i < fleets.length; i++) {
        airForce += fleets[i].getForces();
    }
    return airForce;
};

Universe.prototype.getForces = function getForces(player) {
    return getAirForces(player) + getGroundForces(player);
};

Universe.prototype.drawUniverse = function drawUniverse() {
    var players = this.getActivePlayers();
    players.push(this.getNeutralPlayer());

    /* I'd like to keep the planets on the background and draw over them when the owner changes
     * instead of clearing and redrawing, but it doesn't seem possible with antialiasing, which cannot be deactivated
     */
    var foregroundContext = this.foregroundCanvas.getContext("2d");
    // fastest according to jsperf test
    // for Firefox 24.0 on Ubuntu and Chrome 28.0.1500.71 on Ubuntu Chromium
    foregroundContext.clearRect(0, 0, this.foregroundCanvas.width, this.foregroundCanvas.height);

    // to avoid canvas state changes, loop by color, i.e. by player
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        var planets = this.getPlanets(player);
        foregroundContext.fillStyle = player.color;

        for (var j = 0; j < planets.length; j++) {
            var planet = planets[j];
            var centerX = planet.getX();
            var centerY = planet.getY();
            var radius = planet.radius;

            foregroundContext.beginPath();
            foregroundContext.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            foregroundContext.fill();
        }
    }

    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        var fleets = this.getFleets(player);
        foregroundContext.strokeStyle = player.color;

        for (var j = 0; j < fleets.length; j++) {
            var fleet = fleets[j];
            var currentX = fleet.getX();
            var currentY = fleet.getY();

            var steps = fleet.stepsToTarget();
            var frontX = currentX + (fleet.getDestination().getX() - currentX) / steps;
            var frontY = currentY + (fleet.getDestination().getY() - currentY) / steps;

            var diffX = frontX - currentX;
            var diffY = frontY - currentY;

            var backX = currentX - diffX;
            var backY = currentY - diffY;

            var backRightX = backX - 1/2 * diffY;
            var backRightY = backY + 1/2 * diffX;

            var backLeftX = backX + 1/2 * diffY;
            var backLeftY = backY - 1/2 * diffX;

            foregroundContext.beginPath();
            foregroundContext.moveTo(currentX, currentY);
            foregroundContext.lineTo(backLeftX, backLeftY);
            foregroundContext.lineTo(backRightX, backRightY);
            foregroundContext.lineTo(currentX, currentY);
            // without this repetition there would be sth. missing from one tip of the triangle, it wouldn't be pointy
            foregroundContext.lineTo(backLeftX, backLeftY);
            foregroundContext.stroke();
        }
    }

    foregroundContext.fillStyle = "white";
    foregroundContext.strokeStyle = "black";
    foregroundContext.font = "10pt sans-serif";
    foregroundContext.textBaseline = "middle";
    foregroundContext.lineWidth = 2;

    var planets = this.getAllPlanets();
    for (var i = 0; i < planets.length; i++) {
        var planet = planets[i];
        foregroundContext.strokeText("" + planet.getForces(), planet.getX(), planet.getY());
        foregroundContext.fillText("" + planet.getForces(), planet.getX(), planet.getY());
    }

    // disabled, because it kills performance
    /* foregroundContext.font = "8pt sans-serif";
     for (var fleetId in this.fleets) {
     var fleet = this.fleets[fleetId];
     foregroundContext.strokeText("" + fleet.getForces(), fleet.currentX, fleet.currentY);
     foregroundContext.fillText("" + fleet.getForces(), fleet.currentX, fleet.currentY);
     } */
};

// ---------------------------------------------------------------------------------------------------------------------------------

// TODO add ranking
PlanetWarsGame: function PlanetWarsGame(players, neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId) {
    this.universe = new Universe(players, neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId);
    this.drawGame();
}

// TODO add ranking refresh
PlanetWarsGame.prototype.drawGame = function drawGame() {
    this.universe.drawUniverse();
}

PlanetWarsGame.prototype.stepInterval = 60;
PlanetWarsGame.prototype.stepLoopId = null;
PlanetWarsGame.prototype.running = false;

// TODO visualize winner
PlanetWarsGame.prototype.step = function step() {
    // check if game has ended
    var activePlayers = this.universe.getActivePlayers();

    if (activePlayers.length > 1) {
        this.round += 1;
        this.universe.step();
        this.drawGame();
        window.setTimeout(this.step.bind(this), this.stepInterval);
    } else {
        this.drawGame();
        this.running = false;
    }
};

PlanetWarsGame.prototype.play = function play() {
    this.round = 0;
    if (this.stepLoopId === null) {
        this.running = true;
        this.stepLoopId = window.setTimeout(this.step.bind(this), this.stepInterval);
    }
};



