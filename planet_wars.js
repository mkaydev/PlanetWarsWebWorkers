shuffleArray: function shuffleArray(arr) {
    for (var i = 0; i < arr.length - 1; i++) {
        var switchIndex = Math.floor(Math.random() * arr.length);
        var tmp = arr[i];
        arr[i] = arr[switchIndex];
        arr[switchIndex] = tmp;
    }
}

// -------------------------------------------------------------
Player: function Player() {
    this.color = "white";
}
Player.prototype.isNeutral = false;
Player.prototype.think = function think() {}
Player.prototype.fleetSize = 25;
Player.prototype.reserveFactor = 0;

Player.prototype.getNearest = function getNearest(planet, planets) {
    if (planets.length === 0) return;
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
}
Fleet.prototype.movementPerStep = 10;
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

Fleet.prototype.distanceToTarget = function distanceToTarget() {
    return this.distanceToPos(this.targetPlanet.centerX, this.targetPlanet.centerY);
}

Fleet.prototype.stepsToTarget = function stepsToTarget() {
    var distance = this.distanceToTarget();
    return Math.floor(distance / this.movementPerStep);
}


Fleet.prototype.step = function step() {
    var distance = this.distanceToPos(this.targetPlanet.centerX, this.targetPlanet.centerY);
    if (distance <= this.movementPerStep) {
        // attack / defend
        this.targetPlanet.enteredBy(this);
    } else {
        // update position
        var remainingSteps = Math.floor(distance / this.movementPerStep);

        var xDiff = this.targetPlanet.centerX - this.currentX;
        var yDiff = this.targetPlanet.centerY - this.currentY;

        this.currentX += xDiff / remainingSteps;
        this.currentY += yDiff / remainingSteps;

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

Universe: function Universe(initialPlayers, neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId) {
    this.initialPlayers = initialPlayers;
    this.neutralPlayer = new NeutralPlayer();

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
    shuffleArray(this.activePlayers);
    shuffleArray(this.planets);
    shuffleArray(this.fleets);
}
Universe.prototype.mainPlanetRecruitingPerStep = 6;
Universe.prototype.maxSecondaryPlanetRecruitingPerStep = 4;
Universe.prototype.minSecondaryPlanetRecrutingPerStep = 1

Universe.prototype.drawUniverse = function drawUniverse() {
    var players = this.activePlayers.slice();
    players.push(this.neutralPlayer);

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
            var centerX = planet.centerX;
            var centerY = planet.centerY;
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
            var currentX = fleet.currentX;
            var currentY = fleet.currentY;
            var radius = fleet.radius;

            var steps = fleet.stepsToTarget();
            var frontX = currentX + (fleet.targetPlanet.centerX - currentX) / steps;
            var frontY = currentY + (fleet.targetPlanet.centerY - currentY) / steps;

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

    for (var i = 0; i < this.planets.length; i++) {
        var planet = this.planets[i];
        foregroundContext.strokeText("" + planet.forces, planet.centerX, planet.centerY);
        foregroundContext.fillText("" + planet.forces, planet.centerX, planet.centerY);
    }

    // disabled, because it kills performance
   /* foregroundContext.font = "8pt sans-serif";
     for (var fleetId in this.fleets) {
        var fleet = this.fleets[fleetId];
        foregroundContext.strokeText("" + fleet.forces, fleet.currentX, fleet.currentY);
        foregroundContext.fillText("" + fleet.forces, fleet.currentX, fleet.currentY);
     } */
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
    shuffleArray(this.activePlayers);
}

Universe.prototype.getActivePlayers = function getActivePlayers() {
    return this.activePlayers;
}

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



