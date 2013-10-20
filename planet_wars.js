(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

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
    this.color = "black";
    var planetCommands = {};
    this.registerPlanet = function registerPlanet(p, sendFleetCmd) {
        var id = p.getId();
        planetCommands[id] = sendFleetCmd;
    };
    this.deregisterPlanet = function deregisterPlanet(p) {
        var id = p.getId();
        if (!planetCommands.hasOwnProperty(id)) return;
        delete planetCommands[id];
    };

    this.sendFleet = function sendFleet(source, destination, fleetSize) {
        if (isNaN(fleetSize)) return;
        if (typeof destination === "undefined") return;
        if (typeof source === "undefined") return;
        if (source.ownerEquals(this) && source.getForces() > 0 && source != destination) {
            var size = fleetSize;
            if (size > source.getForces()) size = source.getForces();
            planetCommands[source.getId()](size, destination);
        }
    };
};

Player.prototype.isNeutral = false;
Player.prototype.think = function think(universe) {};

NeutralPlayer: function NeutralPlayer() {
    this.color = "grey";
};
NeutralPlayer.prototype = new Player();
NeutralPlayer.prototype.constructor = NeutralPlayer;
NeutralPlayer.prototype.isNeutral = true;

// ---------------------------------------------------------------------------------------------------------------------------------

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
            if (fleetForces != this.getForces()) alert("getForces of fleet was manipulated!");
            if (currentX != this.getX()) alert("getX of fleet was manipulated!");
            if (currentY != this.getY()) alert("getY of fleet was manipulated!");
            if (destination != this.getDestination()) alert("getDestination of fleet was manipulated!");
            if (home != this.getSource()) alert("getSource of fleet was manipulated!");
            if (ownerEquals.toString() != this.ownerEquals.toString()) alert("ownerEquals of fleet was manipulated!");
            if (fleetMovementPerStep != this.getMovementPerStep()) alert("getMovementPerStep of fleet was manipulated!");
            if (fleetId != this.getId()) alert("getId of fleet was manipulated!");

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
            if (size > groundForces) return;
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
    setGetDefendingFleets(planetOwner);
    setGetAttackingFleets(planetOwner);

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
                registerPlanet(planetOwner);

            } else {
                groundForces -= fleet.getForces();
            }
        }
    }.bind(this);

    var isFleetOrigin = this.isFleetOrigin;
    var step = function step() {
        if (this.isNeutral()) return;
        groundForces += this.getRecruitingPerStep();
        if (recruitingPerStep != this.getRecruitingPerStep()) alert("getRecruitingPerStep of planet was manipulated!");
        if (groundForces != this.getForces()) alert("getForces of planet was manipulated!");
        if (x != this.getX()) alert("getX of planet was manipulated!");
        if (y != this.getY()) alert("getY planet was manipulated!");
        if (isFleetOrigin.toString() != this.isFleetOrigin.toString()) alert("isFleetOrigin of planet was manipulated!");
        if (ownerEquals.toString() != this.ownerEquals.toString()) alert("ownerEquals of planet was manipulated!");
    }.bind(this);

    universe.registerPlanetStepFunction(step);

    this.fleetStepsTo = function fleetStepsTo(otherPlanet) {
        var distance = this.distanceTo(otherPlanet);
        return Math.floor(distance / fleetMovementPerStep);
    };
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

// ---------------------------------------------------------------------------------------------------------------------------------
// TODO create canvas + ids here
Universe: function Universe(initialPlayers, neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId) {
    this.currentStep = 0;
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
    this.textCanvasId = textCanvasId;
    this.textCanvas = document.getElementById(this.textCanvasId);

    this.width = width;
    this.height = height;
    $("#" + foregroundCanvasId).attr("width", this.width);
    $("#" + foregroundCanvasId).attr("height", this.height);
    $("#" + backgroundCanvasId).attr("width", this.width);
    $("#" + backgroundCanvasId).attr("height", this.height);
    $("#" + textCanvasId).attr("width", this.width);
    $("#" + textCanvasId).attr("height", this.height);

    var textContext = this.textCanvas.getContext("2d");
    textContext.fillStyle = "white";
    textContext.strokeStyle = "black";
    textContext.font = "10pt sans-serif";
    textContext.textBaseline = "middle";
    textContext.lineWidth = 2;

    var context = this.backgroundCanvas.getContext("2d");
    context.fillStyle = "black";
    context.fillRect(0, 0, this.width, this.height);

    var planetStepFuncs = [];
    this.registerPlanetStepFunction = function registerPlanetStepFunction(stepFunc) {
        planetStepFuncs.push(stepFunc);
    };

    // create main planets for players
    var planets = [];

    var createNewPlanet = function createNewPlanet(recruitingPerStep, owner) {
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
        var planet = createNewPlanet(this.mainPlanetRecruitingPerStep, player);
        planets.push(planet);
    }

    // create neutral planets
    for (var i = 0; i < neutralPlanetCount; i++) {
        var recruiting = Math.round((this.maxSecondaryPlanetRecruitingPerStep - this.minSecondaryPlanetRecrutingPerStep) * Math.random()) + this.minSecondaryPlanetRecrutingPerStep;
        var planet = createNewPlanet(recruiting, this.getNeutralPlayer());
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
        fleets[flightId] = fleet;
        fleetStepFuncs[flightId] = stepFunc;
    };

    this.deregisterFleet = function deregisterFleet(fleet) {
        var flightId = fleet.getId();
        delete fleets[flightId];
        delete fleetStepFuncs[flightId];
    };

    this.step = function step() {
        this.currentStep += 1;
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

Universe.prototype.sortByDistance = function sortByDistance(planet, planets) {
    var sortByDist = function sortByDist(a, b) {
        var distA = planet.distanceTo(a);
        var distB = planet.distanceTo(b);
        return distA - distB;
    };
    planets.sort(sortByDist);
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

    // text drawing seems to be incredibly slow
    if (this.currentStep % 3 == 0) {
        var textContext = this.textCanvas.getContext("2d");
        textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);

        var planets = this.getAllPlanets();
        for (var i = 0; i < planets.length; i++) {
            var planet = planets[i];
            textContext.strokeText("" + planet.getForces(), planet.getX(), planet.getY());
            textContext.fillText("" + planet.getForces(), planet.getX(), planet.getY());
        }
    }
};

// ---------------------------------------------------------------------------------------------------------------------------------

// TODO add ranking
PlanetWarsGame: function PlanetWarsGame(players, neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId) {
    this.universe = new Universe(players, neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId);
    this.drawGame();
    this.lastStepped = new Date().getTime();
}

// TODO add ranking refresh
PlanetWarsGame.prototype.drawGame = function drawGame() {
    this.universe.drawUniverse();
}

PlanetWarsGame.prototype.drawInterval = 36;
PlanetWarsGame.prototype.stepLoopId = null;
PlanetWarsGame.prototype.running = false;
PlanetWarsGame.prototype.maxRounds = 2000;
// TODO visualize winner
PlanetWarsGame.prototype.step = function step(timestamp) {
    var activePlayers = this.universe.getActivePlayers();

    if (activePlayers.length > 1 && this.round < this.maxRounds) {
        var now = new Date().getTime();
        if (this.lastDrawn == this.round) {
            this.round += 1;
            this.universe.step();
            this.lastStepped = now;
        }
        if ((now - this.lastStepped > this.drawInterval) && (this.lastDrawn < this.round)) {
            this.drawGame();
            this.lastDrawn = this.round;
        }
        requestAnimationFrame(this.step.bind(this));
    } else {
        this.drawGame();
        this.running = false;
    }
};

PlanetWarsGame.prototype.play = function play() {
    this.round = 0;
    this.lastDrawn = 0;
    if (this.stepLoopId === null) {
        this.running = true;
        window.requestAnimationFrame(this.step.bind(this));
    }
};