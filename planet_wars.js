Player: function Player() {
    this.color = "white";
}
Player.prototype.isNeutral = false;
Player.prototype.think = function think() {}
Player.prototype.fleetSize = 25;
Player.prototype.reserveFactor = 0;

Player.prototype.getNearest = function getNearest(planet, planets) {
    var curMinDist = Infinity;
    var curPlanet;

    for (var i = 0; i < planets.length; i++) {
        var dist = planet.distanceTo(planets[i]);
        if (dist < curMinDist) {
            curMinDist = dist;
            curPlanet = planets[i];
        }
    }

    return curPlanet;
}

Player.prototype.sendFleet = function sendFleet(source, destination, fleetSize) {
    if (isNaN(fleetSize)) return;
    if (typeof destination === "undefined") return;
    if (typeof source === "undefined") return;
    if (source.owner === this && source.forces > 0 && source != destination) {
        var size = fleetSize;
        if (size > source.forces) size = source.forces;

        source.forces -= size;
        var fleet = new Fleet(size, source, destination);
        this.universe.registerFleet(fleet);
    }
}


NeutralPlayer.prototype = new Player();
NeutralPlayer.prototype.constructor = NeutralPlayer;
function NeutralPlayer() {
    this.color = "grey";
}
NeutralPlayer.prototype.isNeutral = true;

// ---------------------------------------------------------------------------------------------------------------------------------

Fleet: function Fleet(forces, homePlanet, targetPlanet) {
    this.owner = homePlanet.owner;
    this.homePlanet = homePlanet;
    this.forces = forces;
    this.targetPlanet = targetPlanet;
    this.currentX = homePlanet.centerX;
    this.currentY = homePlanet.centerY;
    this.radius = Math.max(Math.min(this.forces / 5, 10), 3);
}
Fleet.prototype.movementPerStep = 10;
Fleet.prototype.drawFleet = function drawFleet(context) {
    context.fillStyle = "black";
    context.strokeStyle = this.owner.color;
    context.beginPath();
    context.arc(this.currentX, this.currentY, this.radius, 0, 2 * Math.PI, false);
    context.fill();
    context.stroke();

    context.fillStyle = "white";
    context.font = "8pt sans-serif";
    context.textBaseline = "middle";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.strokeText("" + this.forces, this.currentX, this.currentY);
    context.fillText("" + this.forces, this.currentX, this.currentY);
}
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
}


Fleet.prototype.step = function step() {
    var distance = this.distanceToPos(this.targetPlanet.centerX, this.targetPlanet.centerY);
    if (distance <= this.movementPerStep) {
        // attack / defend
        this.targetPlanet.enteredBy(this);
    } else {
        // update position
        var distX;
        var xDiff;
        if (this.targetPlanet.centerX > this.currentX) {
            distX = this.targetPlanet.centerX - this.currentX;
            xDiff = 1;
        } else if (this.targetPlanet.centerX < this.currentX) {
            distX = this.currentX - this.targetPlanet.centerX;
            xDiff = -1;
        } else {
            distX = 0;
            xDiff = 0;
        }

        var distY;
        var yDiff;
        if (this.targetPlanet.centerY > this.currentY) {
            distY = this.targetPlanet.centerY - this.currentY;
            yDiff = 1;
        } else if (this.targetPlanet.centerY < this.currentY) {
            distY = this.currentY - this.targetPlanet.centerY;
            yDiff = -1;
        } else {
            distY = 0;
            yDiff = 0;
        }

        for (var i = 0; i < this.movementPerStep; i++) {
            if (distX > distY) {
                this.currentX += xDiff;
                distX -= xDiff;
            } else {
                this.currentY += yDiff;
                distY -= yDiff;
            }
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------------------------

Planet: function Planet(owner, recruitingPerStep, centerX, centerY) {
    this.owner = owner;
    this.recruitingPerStep = recruitingPerStep;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = recruitingPerStep * 5; // assumes integer
    this.forces = 5 * this.recruitingPerStep;
}

Planet.prototype.drawPlanet = function drawPlanet(context) {
    context.fillStyle = this.owner.color;
    context.beginPath();
    context.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI, false);
    context.fill();

    context.fillStyle = "white";
    context.font = "10pt sans-serif";
    context.textBaseline = "middle";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.strokeText("" + this.forces, this.centerX, this.centerY);
    context.fillText("" + this.forces, this.centerX, this.centerY);
};

Planet.prototype.enteredBy = function enteredBy(fleet) {
    if (this.owner === fleet.owner) {
        this.forces += fleet.forces;
    } else {
        if (fleet.forces > this.forces) {
            this.owner = fleet.owner;
            this.forces = fleet.forces - this.forces;
        } else {
            this.forces -= fleet.forces;
        }
    }
    this.universe.unregisterFleet(fleet);
}

// uses center coordinates
Planet.prototype.distanceTo = function distanceTo(otherPlanet) {
    var yDiff;
    if (otherPlanet.centerY > this.centerY) {
        yDiff = otherPlanet.centerY - this.centerY;
    } else {
        yDiff = this.centerY - otherPlanet.centerY;
    }

    var xDiff;
    if (otherPlanet.centerX > this.centerX) {
        xDiff = otherPlanet.centerX - this.centerX;
    } else {
        xDiff = this.centerX - otherPlanet.centerX;
    }

    var distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return distance;
}

Planet.prototype.minDistanceToOther = 5;
Planet.prototype.collidesWith = function collidesWith(otherPlanet) {
    var distance = this.distanceTo(otherPlanet);
    if (distance - this.minDistanceToOther > this.radius + otherPlanet.radius) return false;
    return true;
}

Planet.prototype.fullyVisibleIn = function fullyVisibleIn(canvasWidth, canvasHeight) {
    if (this.centerX - this.radius < 0) return false;
    if (this.centerY - this.radius < 0) return false;
    if (this.centerX + this.radius >= canvasWidth) return false;
    if (this.centerY + this.radius >= canvasHeight) return false;
    return true;
}

Planet.prototype.step = function step() {
    if (this.owner.isNeutral) return;
    this.forces += this.recruitingPerStep;
}

// ---------------------------------------------------------------------------------------------------------------------------------

Universe: function Universe(initialPlayers, neutralPlanetCount, width, height, canvasId) {
    this.initialPlayers = initialPlayers;
    this.neutralPlayer = new NeutralPlayer();

    this.canvasId = canvasId;
    this.canvas = document.getElementById(this.canvasId);

    this.width = width;
    this.height = height;
    $("#" + canvasId).attr("width", this.width);
    $("#" + canvasId).attr("height", this.height);

    // create main planets for players
    this.planets = [];
    for (var i = 0; i < this.initialPlayers.length; i++) {
        var player = this.initialPlayers[i];
        player.universe = this;
        var planet = this.createNewPlanet(this.mainPlanetRecruitingPerStep, player);
        planet.universe = this;
        this.planets.push(planet);
    }

    // create neutral planets
    for (var i = 0; i < neutralPlanetCount; i++) {
        var recruiting = Math.round((this.maxSecondaryPlanetRecruitingPerStep - this.minSecondaryPlanetRecrutingPerStep) * Math.random()) + this.minSecondaryPlanetRecrutingPerStep;
        var planet = this.createNewPlanet(recruiting, this.neutralPlayer);
        planet.universe = this;
        this.planets.push(planet);
    }
    this.fleets = {};
    this.activePlayers = this.initialPlayers;
}
Universe.prototype.mainPlanetRecruitingPerStep = 5;
Universe.prototype.maxSecondaryPlanetRecruitingPerStep = 4;
Universe.prototype.minSecondaryPlanetRecrutingPerStep = 1

Universe.prototype.drawUniverse = function drawUniverse() {
    var context = this.canvas.getContext("2d");
    context.fillStyle = "black";
    context.fillRect(0, 0, this.width, this.height);
    for (var i = 0; i < this.planets.length; i++) {
        this.planets[i].drawPlanet(context);
    }
    for (var fleetId in this.fleets) {
        this.fleets[fleetId].drawFleet(context);
    }
}

Universe.prototype.getNewPlanetCoords = function getNewPlanetCoords() {
    var x = Math.round(this.width * Math.random());
    var y = Math.round(this.height * Math.random());
    return {"x": x, "y": y};
};

Universe.prototype.createNewPlanet = function createNewPlanet(recruitingPerStep, owner) {
    var collides = true;
    while (collides) {
        var coords;
        var planet;
        var fullyVisible = false;

        while (!fullyVisible) {
            coords = this.getNewPlanetCoords();
            planet = new Planet(owner, recruitingPerStep, coords.x, coords.y);
            fullyVisible = planet.fullyVisibleIn(this.width, this.height);
        }

        collides = false;
        for (var i = 0; i < this.planets.length; i++) {
            if (this.planets[i].collidesWith(planet)) {
                collides = true;
                break;
            }
        }
        if (!collides) return planet;
    }
}

Universe.prototype.registerFleet = function registerFleet(fleet) {
    fleet.flightId = fleet.homePlanet.centerX + "" + fleet.homePlanet.centerY + "" + fleet.targetPlanet.centerX + "" + fleet.targetPlanet.centerY + "" + new Date().getTime() ;
    if (this.fleets.hasOwnProperty(fleet.flightId)) console.log(fleet.flightId);
    this.fleets[fleet.flightId] = fleet;
}
Universe.prototype.unregisterFleet = function unregisterFleet(fleet) {
    delete this.fleets[fleet.flightId];
}

Universe.prototype.getFleets = function getFleets(player) {
    var fleetsAsArray = this.getAllFleets();
    var myFleets = [];
    for (var i = 0; i < fleetsAsArray.length; i++) {
        if (fleetsAsArray[i].owner === player) myFleets.push(fleetsAsArray[i]);
    }
    return myFleets;
}
Universe.prototype.getEnemyFleets = function getEnemyFleets(player) {
    var fleetsAsArray = this.getAllFleets();
    var enemyFleets = [];
    for (var i = 0; i < fleetsAsArray.length; i++) {
        if (fleetsAsArray[i].owner !== player) enemyFleets.push(fleetsAsArray[i]);
    }
    return enemyFleets;
}

Universe.prototype.getAllPlanets = function getAllPlanets() {
    return this.planets;
}

Universe.prototype.getAllFleets = function getAllFleets() {
    var fleetsAsArray = $.map(this.fleets, function(k, v) {
        return [k];
    });
    return fleetsAsArray;
}

Universe.prototype.getPlanets = function getPlanets(player) {
    var planets = [];
    for (var i = 0; i < this.planets.length; i++) {
        if (this.planets[i].owner === player) planets.push(this.planets[i]);
    }
    return planets;
}
Universe.prototype.getNeutralPlanets = function getNeutralPlanets() {
    var planets = [];
    for (var i = 0; i < this.planets.length; i++) {
        if (this.planets[i].owner === this.neutralPlayer) planets.push(this.planets[i]);
    }
    return planets;
}
Universe.prototype.getEnemyPlanets = function getEnemyPlanets(player) {
    var planets = [];
    for (var i = 0; i < this.planets.length; i++) {
        if (this.planets[i].owner !== player) planets.push(this.planets[i]);
    }
    return planets;
}

Universe.prototype.getGroundForce = function getGroundForce(player) {
    var planets = this.getPlanets(player);
    var groundForce = 0;
    for (var i = 0; i < planets.length; i++) {
        groundForce += planets[i].forces;
    }
    return groundForce;
}

Universe.prototype.getAirForce = function getAirForce(player) {
    var fleets = this.getFleets(player);
    var airForce = 0;
    for (var i = 0; i < fleets.length; i++) {
        airForce += fleets[i].forces;
    }
    return airForce;
}

Universe.prototype.getForce = function getForce(player) {
    return getAirForce(player) + getGroundForce(player);
}

// TODO should be called at end of each step
Universe.prototype.determineActivePlayers = function determineActivePlayers() {
    var activePlayers = [];

    for (var i = 0; i < this.initialPlayers.length; i++) {
        var planetCount = this.getPlanets(this.initialPlayers[i]).length;
        var fleetCount = this.getFleets(this.initialPlayers[i]).length;
        if (planetCount + fleetCount > 0) activePlayers.push(this.initialPlayers[i]);
    }

    return activePlayers;
}

Universe.prototype.step = function step() {
    for (var fleetId in this.fleets) {
        this.fleets[fleetId].step();
    }

    for (var i = 0; i < this.planets.length; i++) {
        this.planets[i].step();
    }

    for (var i = 0; i < this.activePlayers.length; i++) {
        this.activePlayers[i].think();
    }

    this.activePlayers = this.determineActivePlayers();
}

Universe.prototype.getActivePlayers = function getActivePlayers() {
    return this.activePlayers;
}

// ---------------------------------------------------------------------------------------------------------------------------------

// TODO add ranking
PlanetWarsGame: function PlanetWarsGame(players, neutralPlanetCount, width, height, canvasId) {
    this.universe = new Universe(players, neutralPlanetCount, width, height, canvasId);
    this.drawGame();
}

// TODO add ranking refresh
PlanetWarsGame.prototype.drawGame = function drawGame() {
    this.universe.drawUniverse();
}

PlanetWarsGame.prototype.stepInterval = 50;
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
}

PlanetWarsGame.prototype.play = function play() {
    this.round = 0;
    if (this.stepLoopId === null) {
        this.running = true;
        this.stepLoopId = window.setTimeout(this.step.bind(this), this.stepInterval);
    }
}



