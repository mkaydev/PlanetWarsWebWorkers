function Universe(playerFiles, planetCount, width, height, initializedCallback) {
    var i,
        j,
        workerId,
        worker,
        workers,
        playerCount,
        file,
        playerId;

    this.allFleets = null;
    this.allPlanets = null;
    this.planetCache = {};
    this.fleetCache = {};

    this.initialized = false;
    this.width = width;
    this.height = height;
    this.fleetMovementPerStep = 10;

    playerCount = playerFiles.length;
    this.playerCount = playerCount;
    this.neutralPlanetCount = planetCount - playerCount;

    this.workers = {};
    workers = this.workers;
    this.players = {};
    this.activePlayers = [];

    this.planets = [];
    this.fleets = {};

    this.thinkFinished = {};

    // workerIds must be kept secret from other sub-workers, playerIds are public
    for (i = 0; i < playerCount; ++i) {
        workerId = createId();

        worker = new Worker("universe_slave.js");
        workers[workerId] = worker;

        worker.onmessage = function(oEvent) {
            var playerJSON,
                player,
                players,
                activePlayers,
                newFleets,
                newFleet,
                sourceId,
                destinationId,
                forces,
                source,
                sourceForces,
                destination,
                data,
                action,
                workerId,
                workers;

            data = oEvent.data;
            action = data.action;
            workerId = data.workerId;
            workers = this.workers;

            if (!workers.hasOwnProperty(workerId)) {
                if (action == "log") {
                    console.log(data.message);
                } else if (action == "alert") {
                    window.alert(data.message);
                } else {
                    console.log("unrecognized action " + action);
                }
                return;
            }

            players = this.players;

            if (action == "registerFleets") {

                if (this.thinkFinished[workerId]) return;

                player = players[workerId];
                newFleets = oEvent.data.newFleets;

                for (j = 0; newFleet = newFleets[j]; ++j) {
                    sourceId = newFleet[_STATE_KEYS["sourceId"]];
                    destinationId = newFleet[_STATE_KEYS["destinationId"]];
                    forces = Math.floor(newFleet[_STATE_KEYS["forces"]]);

                    if (forces <= 0) continue;

                    source = this.getPlanet(sourceId);
                    if (source === null) continue;
                    if (source.getOwner().id !== player.id) continue;

                    sourceForces = source.getForces();
                    if (sourceForces <= 0) continue;

                    if (sourceForces < forces) forces = sourceForces;

                    destination = this.getPlanet(destinationId);
                    if (destination === null) continue;

                    this.registerFleet(source, destination, forces);
                }

                this.thinkFinished[workerId] = true;
                if (this.stepFinished()) {
                    this.determineActivePlayers();
                    this.steppedCallback();
                }

            } else if (action == "linkPlayer") {

                if (players.hasOwnProperty(workerId)) return;
                playerJSON = data.player;
                player = new Player(playerJSON)

                players[workerId] = player;
                activePlayers = this.activePlayers;
                activePlayers.push(player);

                if (activePlayers.length == this.playerCount) {
                    this.createPlanets();
                    this.initialized = true;
                    initializedCallback();
                }

            } else {
                console.log("unrecognized action " + action);
            }
        }.bind(this);

        file = playerFiles[i];
        playerId = createId();

        worker.postMessage({
            "action": "initialize",
            "workerId": workerId,
            "playerId": playerId,
            "playerFile": file
        });
    }
}

Universe.prototype.stepFinished = function stepFinished() {
    var workerId, thinkFinished;
    thinkFinished = this.thinkFinished;

    for (workerId in thinkFinished) {
        if (!thinkFinished[workerId]) return false;
    }
    return true;
};

Universe.prototype.registerFleet = function registerFleet(source, destination, forces) {
    var fleet = new Fleet(forces, source, destination, this.fleetMovementPerStep);
    source.setForces(source.getForces() - forces);
    this.fleets[fleet.getId()] = fleet;
};

Universe.prototype.deregisterFleet = function deregisterFleet(fleet) {
    delete this.fleets[fleet.getId()];
};

Universe.prototype.getPlanet = function getPlanet(planetId) {
    var i, planet, planets;
    planets = this.planets;

    for (i = 0; planet = planets[i]; ++i) {
        if (planetId == planet.getId()) return planet;
    }
    return null;
};

Universe.prototype.getWorkerId = function getPlayer(playerId) {
    var workerId, player, players;
    players = this.players;

    for (workerId in players) {
        player = players[workerId];
        if (player.id == playerId) return workerId;
    }
};

Universe.prototype.terminateWorkers = function terminateWorkers() {
    var workerId, workers;
    workers = this.workers;

    for (workerId in workers) {
        workers[workerId].terminate();
    }
};

Universe.prototype.determineActivePlayers = function determineActivePlayers() {
    var i,
        planetCount,
        fleetCount,
        player,
        workerId,
        workers,
        activePlayers,
        curActivePlayers,
        curActivePlayersLen,
        workers,
        players;

    activePlayers = [];
    curActivePlayers = this.activePlayers;
    curActivePlayersLen = curActivePlayers.length;
    workers = this.workers;
    players = this.players;

    for (i = 0; i < curActivePlayersLen; ++i) {
        player = curActivePlayers[i];
        planetCount = this.getPlanets(player).length;
        fleetCount = this.getFleets(player).length;

        if (planetCount + fleetCount > 0) {
            activePlayers.push(player);
        } else {
            workerId = this.getWorkerId(player.id);
            workers[workerId].postMessage({
                "action": "die"
            });
            delete workers[workerId];
            delete players[workerId];
        }
    }

    shuffleArray(activePlayers);
    this.activePlayers = activePlayers;
};

Universe.prototype.step = function step(steppedCallback) {
    var i,
        json,
        player,
        playerId,
        workerId,
        worker,
        planet,
        fleetId,
        fleet,
        thinkFinished,
        activePlayers,
        workers,
        planets,
        fleets;

    thinkFinished = {};
    activePlayers = this.activePlayers;
    workers = this.workers;
    planets = this.planets;
    fleets = this.fleets;

    for (fleetId in fleets) {
        fleet = fleets[fleetId];
        fleet.step();
    }

    for (i = 0; planet = planets[i]; ++i) {
        planet.step();
    }

    this.thinkFinished = thinkFinished;
    this.steppedCallback = steppedCallback;

    this.allFleets = null;
    this.allPlanets = null;
    this.fleetCache = {};
    this.planetCache = {};

    json = this.toJSON();
    for (i = 0; player = activePlayers[i]; ++i) {
        playerId = player.id;
        workerId = this.getWorkerId(playerId);
        worker = workers[workerId];

        thinkFinished[workerId] = false;
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
    var i, el, sum;
    sum = 0;

    for (i = 0; el = arr[i]; ++i) {
        sum += el.getForces();
    }
    return sum;
};

Universe.prototype.toJSON = function toJSON() {
    var i,
        json,
        id,
        fleets,
        jsonFleets,
        planets,
        jsonPlanets,
        airForces,
        groundForces,
        forces,
        exportedPlayer,
        player,
        activePlayers,
        exportedFleets,
        exportedPlanets,
        exportedPlayers;

    activePlayers = this.activePlayers;
    exportedFleets = {};
    exportedPlanets = {};
    exportedPlayers = {};

    for (i = 0; player = activePlayers[i]; ++i) {
        id = player.id;

        fleets = this.getFleets(player);
        jsonFleets = this.exportArray(fleets);
        exportedFleets[id] = jsonFleets;

        planets = this.getPlanets(player);
        jsonPlanets = this.exportArray(planets);
        exportedPlanets[id] = jsonPlanets;

        airForces = this.sumForces(fleets);
        groundForces = this.sumForces(planets);
        forces = airForces + groundForces;

        exportedPlayer = player.toJSON();
        exportedPlayer[_STATE_KEYS["id"]] = id;
        exportedPlayer[_STATE_KEYS["forces"]] = forces;
        exportedPlayer[_STATE_KEYS["airForces"]] = airForces;
        exportedPlayer[_STATE_KEYS["groundForces"]] = groundForces;
        exportedPlayers[id] = exportedPlayer;
    }

    id = neutralPlayer.id;
    planets = this.getPlanets(neutralPlayer);
    jsonPlanets = this.exportArray(planets);
    exportedPlanets[id] = jsonPlanets;

    groundForces = this.sumForces(planets);

    exportedPlayer = neutralPlayerJSON;
    exportedPlayer[_STATE_KEYS["id"]] = id;
    exportedPlayer[_STATE_KEYS["forces"]] = groundForces;
    exportedPlayer[_STATE_KEYS["airForces"]] = 0;
    exportedPlayer[_STATE_KEYS["groundForces"]] = groundForces;
    exportedPlayers[id] = exportedPlayer;

    json = {};
    json[_STATE_KEYS["activePlayersCount"]] = activePlayers.length;
    json[_STATE_KEYS["players"]] = exportedPlayers;
    json[_STATE_KEYS["planets"]] = exportedPlanets;
    json[_STATE_KEYS["fleets"]] = exportedFleets;
    json[_STATE_KEYS["width"]] = this.width;
    json[_STATE_KEYS["height"]] = this.height;
    json[_STATE_KEYS["fleetMovementPerStep"]] = this.fleetMovementPerStep;
    return json;
};

Universe.prototype.getAllFleets = function getAllFleets() {
    var fleetId, fleets, fleetsAsArray;
    if (this.allFleets !== null) return this.allFleets;
    fleets = this.fleets;
    fleetsAsArray = [];

    for (fleetId in fleets) {
        fleetsAsArray.push(fleets[fleetId]);
    };

    shuffleArray(fleetsAsArray);
    this.allFleets = fleetsAsArray;
    return fleetsAsArray;
};

Universe.prototype.getFleets = function getFleets(player) {
    var i, fleetArr, playerId, fleetsAsArray, myFleets;
    playerId = player.id;
    if (this.fleetCache.hasOwnProperty(playerId)) {
        return this.fleetCache[playerId];
    }

    fleetsAsArray = this.getAllFleets();
    myFleets = [];

    for (i = 0; fleetArr = fleetsAsArray[i]; ++i) {
        if (fleetArr.getOwner().id == playerId) myFleets.push(fleetArr);
    }

    this.fleetCache[playerId] = myFleets;
    return myFleets;
};

Universe.prototype.getAllPlanets = function getAllPlanets() {
    return this.planets;
};

Universe.prototype.getPlanets = function getPlanets(player) {
    var i, planet, playerId, all, planets;
    playerId = player.id;
    if (this.planetCache.hasOwnProperty(playerId)) {
        return this.planetCache[playerId];
    }

    all = this.getAllPlanets();
    planets = [];

    for (i = 0; planet = all[i]; ++i) {
        if (planet.getOwner().id === playerId) planets.push(planet);
    }

    this.planetCache[playerId] = planets;
    return planets;
};

Universe.prototype.fleetMovementPerStep = 4;
Universe.prototype.mainPlanetRecruitingPerStep = 6;
Universe.prototype.mainPlanetInitialForces = 300;
Universe.prototype.minDistanceFromMainPlanet = 20;  // excludes radius
Universe.prototype.maxSecondaryPlanetRecruitingPerStep = 4;
Universe.prototype.minSecondaryPlanetRecrutingPerStep = 1;

Universe.prototype.createPlanets = function createPlanets() {
    var i,
        workerId,
        player,
        coords,
        planet,
        mainCoords,
        recruiting,
        planets,
        players,
        neutralCount,
        mainRecruiting,
        mainForces,
        maxSecondaryRecr,
        minSecondaryRecr;

    planets = this.planets;
    players = this.players;
    neutralCount = this.neutralPlanetCount;
    mainRecruiting = this.mainPlanetRecruitingPerStep;
    mainForces = this.mainPlanetInitialForces;
    maxSecondaryRecr = this.maxSecondaryPlanetRecruitingPerStep;
    minSecondaryRecr = this.minSecondaryPlanetRecrutingPerStep;

    mainCoords = this.getMainPlanetCoords(this.playerCount);

    i = 0;
    for (workerId in players) {
        player = players[workerId];
        coords = mainCoords[i++];
        planet = new Planet(this, player, mainRecruiting, coords.x, coords.y, mainForces);
        planets.push(planet);
    }

    for (i = 0; i < neutralCount; ++i) {
        recruiting = Math.round((maxSecondaryRecr - minSecondaryRecr) * Math.random()) + minSecondaryRecr;
        planet = this.createNewPlanet(recruiting, neutralPlayer);
        planets.push(planet);
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

    var i, coords, next, centerX, centerY, center, start, r, arcPerPlayer, startAngle, curAngle;

    center = {
        "x": Math.floor(this.width / 2),
        "y": Math.floor(this.height / 2)
    };
    r = (Math.min(this.width, this.height) - (2 * this.minDistanceFromMainPlanet)) / 2;
    arcPerPlayer = (2 * Math.PI) / count;

    start = {};
    startAngle = 0;
    curAngle = arcPerPlayer;

    centerX = center.x;
    centerY = center.y;

    if (count == 4 || count == 2) {
        startAngle = 1/4 * Math.PI;
    } else if (count == 5) {
        startAngle = 5/8 * Math.PI;
    } else if (count % 2 == 1) {
        startAngle = 1/2 * Math.PI;
    } else {
        startAngle = 0;
    }

    start.x = centerX + r * Math.cos(startAngle);
    start.y = centerY + r * Math.sin(startAngle);
    curAngle += startAngle;

    coords = [start];
    for (i = 1; i < count; ++i) {
        next = {
            "x": centerX + r * Math.cos(curAngle),
            "y": centerY + r * Math.sin(curAngle)
        };
        coords.push(next);
        curAngle += arcPerPlayer;
    }
    return coords;
};

Universe.prototype.getNewPlanetCoords = function getNewPlanetCoords() {
    var x, y;
    x = Math.round(this.width * Math.random());
    y = Math.round(this.height * Math.random());
    return {"x": x, "y": y};
};

Universe.prototype.createNewPlanet = function createNewPlanet(recruitingPerStep, owner, initialForces, minDistance) {
    var i, coords, planet, fullyVisible, curPlanet, planets, collides, width, height;
    planets = this.planets;
    collides = true;
    width = this.width;
    height = this.height;

    while (collides) {
        fullyVisible = false;

        while (!fullyVisible) {
            coords = this.getNewPlanetCoords();
            planet = new Planet(this, owner, recruitingPerStep, coords.x, coords.y, initialForces);
            fullyVisible = planet.fullyVisibleIn(width, height);
        }

        collides = false;
        for (i = 0; curPlanet = planets[i]; ++i) {
            if (curPlanet.collidesWith(planet, minDistance)) {
                collides = true;
                break;
            }
        }
        if (!collides) return planet;
    }
};