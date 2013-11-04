Universe: function Universe(playerFiles, planetCount, width, height, initializedCallback) {
    this.initialized = false;
    this.width = width;
    this.height = height;
    this.fleetMovementPerStep = 10;

    this.playerCount = playerFiles.length;
    this.neutralPlanetCount = planetCount - this.playerCount;

    this.workers = {};
    this.players = {};
    this.activePlayers = [];

    this.planets = [];
    this.fleets = {};

    this.thinkFinished = {};

    // workerIds must be kept secret from other sub-workers, playerIds are public
    for (var i = 0; i < playerFiles.length; i++) {
        var workerId = createId("Worker:");

        var worker = new Worker("universe_slave.js");
        this.workers[workerId] = worker;

        worker.onmessage = function(oEvent) {
            var workerId = oEvent.data.workerId;
            var action = oEvent.data.action;

            if (!this.workers.hasOwnProperty(workerId)) {
                if (action === "log") {
                    console.log(oEvent.data.message);
                } else if (action === "alert") {
                    window.alert(oEvent.data.message);
                } else {
                    console.log("unrecognized action " + action);
                }
                return;
            }

            if (action === "registerFleets") {

                if (this.thinkFinished[workerId]) return;

                var player = this.players[workerId];
                var newFleets = oEvent.data.newFleets;

                for (var j = 0; j < newFleets.length; j++) {
                    var newFleet = newFleets[j];
                    var sourceId = newFleet.sourceId;
                    var destinationId = newFleet.destinationId;
                    var forces = Math.floor(newFleet.forces);
                    if (forces <= 0) continue;

                    var source = this.getPlanet(sourceId);
                    if (source === null) continue;
                    if (source.owner.id !== player.id) continue;

                    if (source.forces < forces) forces = source.forces;

                    var destination = this.getPlanet(destinationId);
                    if (destination === null) continue;

                    this.registerFleet(source, destination, forces);
                }

                this.thinkFinished[workerId] = true;
                if (this.stepFinished()) {
                    this.activePlayers = this.determineActivePlayers();
                    this.steppedCallback();
                }

            } else if (action === "linkPlayer") {
                if (this.players.hasOwnProperty(workerId)) return;
                var player = oEvent.data.player;
                this.players[workerId] = player;
                this.activePlayers.push(player);

                if (this.activePlayers.length == this.playerCount) {
                    this.createPlanets();
                    this.initialized = true;
                    initializedCallback();
                }

            } else {
                console.log("unrecognized action " + action);
            }
        }.bind(this);

        var file = playerFiles[i];
        var playerId = createId("Player:");

        worker.postMessage({
            "action": "initialize",
            "workerId": workerId,
            "playerId": playerId,
            "playerFile": file
        });
    }
};

Universe.prototype.stepFinished = function stepFinished() {
    for (var workerId in this.thinkFinished) {
        if (!this.thinkFinished[workerId]) return false;
    }
    return true;
};

Universe.prototype.registerFleet = function registerFleet(source, destination, forces) {
    var fleet = new Fleet(forces, source, destination, this.fleetMovementPerStep);
    source.forces -= forces;
    this.fleets[fleet.id] = fleet;
};

Universe.prototype.deregisterFleet = function deregisterFleet(fleet) {
    delete this.fleets[fleet.id];
};

Universe.prototype.getPlanet = function getPlanet(planetId) {
    for (var i = 0; i < this.planets.length; i++) {
        var planet = this.planets[i];
        if (planetId === planet.id) return planet;
    }
    return null;
};

Universe.prototype.getWorkerId = function getPlayer(playerId) {
    for (var workerId in this.players) {
        var player = this.players[workerId];
        if (player.id === playerId) return workerId;
    }
};

Universe.prototype.determineActivePlayers = function determineActivePlayers() {
    var activePlayers = [];

    for (var i = 0; i < this.activePlayers.length; i++) {
        var planetCount = this.getPlanets(this.activePlayers[i]).length;
        var fleetCount = this.getFleets(this.activePlayers[i]).length;
        if (planetCount + fleetCount > 0) activePlayers.push(this.activePlayers[i]);
    }

    shuffleArray(activePlayers);
    return activePlayers;
};

Universe.prototype.step = function step(steppedCallback) {
    for (var fleetId in this.fleets) {
        var fleet = this.fleets[fleetId];
        fleet.step();
    }

    for (var i = 0; i < this.planets.length; i++) {
        var planet = this.planets[i];
        planet.step();
    }

    this.thinkFinished = {};
    this.steppedCallback = steppedCallback;

    var json = this.toJSON();
    for (var i = 0; i < this.activePlayers.length; i++) {
        var player = this.activePlayers[i];
        var playerId = player.id;
        var workerId = this.getWorkerId(playerId);
        var worker = this.workers[workerId];

        this.thinkFinished[workerId] = false;
        worker.postMessage({
            "action": "think",
            "universe": json
        });
    }
};

Universe.prototype.exportArray = function exportArray(arr) {
    return arr.map(function(value) {
        return value.toJSON();
    });
};

Universe.prototype.sumForces = function sumForces(arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i].forces;
    }
    return sum;
};

Universe.prototype.toJSON = function toJSON() {
    var exportedFleets = {};
    var exportedPlanets = {};
    var exportedPlayers = {};

    for (var i = 0; i < this.activePlayers.length; i++) {
        var player = this.activePlayers[i];
        var id = player.id;

        var fleets = this.getFleets(player);
        var jsonFleets = this.exportArray(fleets);
        exportedFleets[id] = jsonFleets;

        var planets = this.getPlanets(player);
        var jsonPlanets = this.exportArray(planets);
        exportedPlanets[id] = jsonPlanets;

        var airForces = this.sumForces(fleets);
        var groundForces = this.sumForces(planets);
        var forces = airForces + groundForces;

        var exportedPlayer = {};
        for (var key in player) {
            exportedPlayer[key] = player[key];
        }
        exportedPlayer["forces"] = forces;
        exportedPlayer["airForces"] = airForces;
        exportedPlayer["groundForces"] = groundForces;
        exportedPlayers[id] = exportedPlayer;
    }

    var id = neutralPlayer.id;

    var planets = this.getPlanets(neutralPlayer);
    var jsonPlanets = this.exportArray(planets);
    exportedPlanets[id] = jsonPlanets;

    var groundForces = this.sumForces(planets);

    var exportedPlayer = {};
    for (var key in neutralPlayer) {
        exportedPlayer[key] = neutralPlayer[key];
    }
    exportedPlayer["forces"] = groundForces;
    exportedPlayer["airForces"] = 0;
    exportedPlayer["groundForces"] = groundForces;
    exportedPlayers[id] = exportedPlayer;

    return {
        "activePlayersCount": this.activePlayers.length,
        "players": exportedPlayers,
        "planets": exportedPlanets,
        "fleets": exportedFleets,
        "width": this.width,
        "height": this.height,
        "fleetMovementPerStep": this.fleetMovementPerStep
    };
};

Universe.prototype.getAllFleets = function getAllFleets() {
    var fleetsAsArray = [];
    for (var fleetId in this.fleets) {
        fleetsAsArray.push(this.fleets[fleetId]);
    };
    shuffleArray(fleetsAsArray);
    return fleetsAsArray;
};

Universe.prototype.getFleets = function getFleets(player) {
    var fleetsAsArray = this.getAllFleets();
    var myFleets = [];
    for (var i = 0; i < fleetsAsArray.length; i++) {
        if (fleetsAsArray[i].owner.id === player.id) myFleets.push(fleetsAsArray[i]);
    }
    return myFleets;
};

Universe.prototype.getAllPlanets = function getAllPlanets() {
    var copy = this.planets.slice();
    shuffleArray(copy);
    return copy;
};

Universe.prototype.getPlanets = function getPlanets(player) {
    var all = this.getAllPlanets();
    var planets = [];
    for (var i = 0; i < all.length; i++) {
        if (all[i].owner.id === player.id) planets.push(all[i]);
    }
    return planets;
};

Universe.prototype.fleetMovementPerStep = 10;
Universe.prototype.mainPlanetRecruitingPerStep = 6;
Universe.prototype.mainPlanetInitialForces = 300;
Universe.prototype.minDistanceFromMainPlanet = 20;  // excludes radius
Universe.prototype.maxSecondaryPlanetRecruitingPerStep = 4;
Universe.prototype.minSecondaryPlanetRecrutingPerStep = 1;

Universe.prototype.createPlanets = function createPlanets() {
    var mainCoords = this.getMainPlanetCoords(this.playerCount);   // TODO
    var i = 0;
    for (var workerId in this.players) {
        var player = this.players[workerId];
        var coords = mainCoords[i++];
        var planet = new Planet(this, player, this.mainPlanetRecruitingPerStep, coords.x, coords.y, this.mainPlanetInitialForces);
        this.planets.push(planet);
    }

    for (var i = 0; i < this.neutralPlanetCount; i++) {
        var recruiting = Math.round((this.maxSecondaryPlanetRecruitingPerStep - this.minSecondaryPlanetRecrutingPerStep) * Math.random()) + this.minSecondaryPlanetRecrutingPerStep;
        var planet = this.createNewPlanet(recruiting, neutralPlayer);
        this.planets.push(planet);
    }
};

Universe.prototype.getMainPlanetCoords = function getMainPlanetCoords(count) {
    /* The problem is to distribute the main planets in a fair manner, e.g. in a last man standing tournament starting in the center,
     *  while other players have safe backs by starting in a corner would be extremely unfair.
     *
     *  The basic idea is to distribute the main planets equally along the largest circle, which fits the game area.
     *  - This avoids unfair situations where two players have to fight each other early on, while others can conquer neutral planets.
     *  - Another factor to consider is the size of the front-line, i.e. the area on which the player has to fight other players.
     *  -->  This is important for odd numbers of players, because the game area is a rectangle and not a square.
     *       A bigger front-line is a disadvantage and needs to be balanced out by an advantage,
     *       e.g. having a greater distance from other players or better access to neutral planets at the beginning.
     */

    var center = {
        "x": Math.floor(this.width / 2),
        "y": Math.floor(this.height / 2)
    };
    var r = (Math.min(this.width, this.height) - (2 * this.minDistanceFromMainPlanet)) / 2;
    var arcPerPlayer = (2 * Math.PI) / count;

    var start = {};
    var startAngle = 0;
    var curAngle = arcPerPlayer;
    if (count == 4 || count == 2) {
        startAngle = 1/4 * Math.PI;
    } else if (count == 5) {
        startAngle = 5/8 * Math.PI;
    } else if (count % 2 == 1) {
        startAngle = 1/2 * Math.PI;
    } else {
        startAngle = 0;
    }
    start.x = center.x + r * Math.cos(startAngle);
    start.y = center.y + r * Math.sin(startAngle);
    curAngle += startAngle;

    var coords = [start];
    for (var i = 1; i < count; i++) {
        var next = {
            "x": center.x + r * Math.cos(curAngle),
            "y": center.y + r * Math.sin(curAngle)
        };
        coords.push(next);
        curAngle += arcPerPlayer;
    }
    return coords;
};

Universe.prototype.getNewPlanetCoords = function getNewPlanetCoords() {
    var x = Math.round(this.width * Math.random());
    var y = Math.round(this.height * Math.random());
    return {"x": x, "y": y};
};

Universe.prototype.createNewPlanet = function createNewPlanet(recruitingPerStep, owner, initialForces, minDistance) {
    var collides = true;
    while (collides) {
        var coords;
        var planet;
        var fullyVisible = false;

        while (!fullyVisible) {
            coords = this.getNewPlanetCoords();
            planet = new Planet(this, owner, recruitingPerStep, coords.x, coords.y, initialForces);
            fullyVisible = planet.fullyVisibleIn(this.width, this.height);
        }

        collides = false;
        for (var i = 0; i < this.planets.length; i++) {
            if (this.planets[i].collidesWith(planet, minDistance)) {
                collides = true;
                break;
            }
        }
        if (!collides) return planet;
    }
};