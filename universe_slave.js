var _initialized = false,
    _player = null,
    _workerId = null,
    _playerId = null,
    _playerFile = null,
    _universe = null;

importScripts("helper.js", "player_slave.js", "planet_slave.js", "fleet_slave.js");


onmessage = function(oEvent) {
    var data, action;
    data = oEvent.data;
    action = data.action;

    if (action == "think") {

        _universe._fromJSON(data.universe);
        _player.think(_universe);

        postMessage({
            "workerId": _workerId,
            "action": "registerFleets",
            "newFleets": _universe.newFleets
        });

    } else if (action == "initialize") {

        if (_initialized) return;
        _workerId = data.workerId;
        _playerId = data.playerId;
        _playerFile = data.playerFile;

        importScripts(_playerFile);
        _player = new _constructor();
        _player._setId(_playerId);

        _universe = new Universe();
        _initialized = true;

        postMessage({
            "workerId": _workerId,
            "action": "linkPlayer",
            "player": _player.toJSON()
        });
    } else if (action == "die") {
        self.close();
    } else {
        console.log("unrecognized action " + action);
    }
};

onerror = function() {
    self.close();
};

Universe: function Universe() {
    this.playerPool = [];
    this.planetPool = [];
    this.fleetPool = [];

    this.playerPoolIndex = 0;
    this.planetPoolIndex = 0;
    this.fleetPoolIndex = 0;
};

Universe.prototype._fromJSON = function _fromJSON(universeState) {
    var planetsJSON,
        fleetsJSON,
        playerId,
        playersJSON,
        playerJSON,
        player,
        players,
        playersArray,
        planetsPerPlayer,
        planetsArray,
        fleetsPerPlayer,
        fleetsArray,
        playersPlanetsJSON,
        playersPlanets,
        playersFleetsJSON,
        playersFleets;

    this.playerPoolIndex = 0;
    this.planetPoolIndex = 0;
    this.fleetPoolIndex = 0;

    this.width = universeState[_STATE_KEYS["width"]];
    this.height = universeState[_STATE_KEYS["height"]];
    this.fleetMovementPerStep = universeState[_STATE_KEYS["fleetMovementPerStep"]];

    this.newFleets = [];

    players = {};
    playersArray = [];
    planetsPerPlayer = {};
    planetsArray = [];
    fleetsPerPlayer = {};
    fleetsArray = [];
    this._neutralPlayerId = null;

    playersJSON = universeState[_STATE_KEYS["players"]];
    planetsJSON = universeState[_STATE_KEYS["planets"]];
    fleetsJSON = universeState[_STATE_KEYS["fleets"]];

    for (playerId in playersJSON) {
        playerJSON = playersJSON[playerId];
        player = this._toPlayerObject(playerJSON);

        if (player.isNeutral) {
            this._neutralPlayerId = playerId;
        } else {
            playersArray.push(player);
        }

        players[playerId] = player;
    }

    this._players = players;
    this._playersArray = playersArray;
    this._playersJSON = playersJSON;

    for (var i = 0; player = playersArray[i]; ++i) {
        playerId = player.id;

        if (planetsJSON.hasOwnProperty(playerId)) {
            playersPlanetsJSON = planetsJSON[playerId];
            playersPlanets = this._toPlanetObjects(playersPlanetsJSON);
            planetsPerPlayer[playerId] = playersPlanets;
            planetsArray.push.apply(planetsArray, playersPlanets);

        } else {
            planetsPerPlayer[playerId] = [];
        }
    }

    playerId = this._neutralPlayerId;

    if (planetsJSON.hasOwnProperty(playerId)) {
        playersPlanetsJSON = planetsJSON[playerId];
        playersPlanets = this._toPlanetObjects(playersPlanetsJSON);
        planetsPerPlayer[playerId] = playersPlanets;
        planetsArray.push.apply(planetsArray, playersPlanets);

    } else {
        planetsPerPlayer[playerId] = [];
    }

    for (var i = 0; player = playersArray[i]; ++i) {
        playerId = player.id;

        if (fleetsJSON.hasOwnProperty(playerId)) {
            playersFleetsJSON = fleetsJSON[playerId];
            playersFleets = this._toFleetObjects(playersFleetsJSON);
            fleetsPerPlayer[playerId] = playersFleets;
            fleetsArray.push.apply(fleetsArray, playersFleets);

        } else {
            fleetsPerPlayer[playerId] = [];
        }
    }

    this._planetsPerPlayer = planetsPerPlayer;
    this._planetsArray = planetsArray;
    this._fleetsPerPlayer = fleetsPerPlayer;
    this._fleetsArray = fleetsArray;

    // will cache enemy-fleets/planets per player
    this._fleetCache = {};
    this._planetCache = {};
};

// create wrappers for the json, with additional functions for use by the players
// recycling objects to avoid unnecessary garbage collection, which tends to freeze the animation
Universe.prototype._toPlanetObjects = function _toPlanetObject(planetsJSON) {
    var i, planet, planetJSON, planets, pool, poolLen, poolIndex;
    planets = [];
    pool = this.planetPool;
    poolLen = pool.length;
    poolIndex = this.planetPoolIndex;

    for (i = 0; planetJSON = planetsJSON[i]; ++i) {

        if (poolIndex >= poolLen) {
            planet = new Planet(planetJSON, this);
            pool.push(planet);
        } else {
            planet = pool[poolIndex];
            planet._setState(planetJSON);
        }
        planets.push(planet);
        poolIndex = ++this.planetPoolIndex;
    }
    return planets;
};

Universe.prototype._toFleetObjects = function _toFleetObjects(fleetsJSON) {
    var i, fleet, fleetJSON, fleets, pool, poolLen, poolIndex;
    fleets = [];
    pool = this.fleetPool;
    poolLen = pool.length;
    poolIndex = this.fleetPoolIndex;

    for (i = 0; fleetJSON = fleetsJSON[i]; ++i) {

        if (poolIndex >= poolLen) {
            fleet = new Fleet(fleetJSON, this);
            pool.push(fleet);
        } else {
            fleet = pool[poolIndex];
            fleet._setState(fleetJSON);
        }
        fleets.push(fleet);
        poolIndex = ++this.fleetPoolIndex;
    }
    return fleets;
};

Universe.prototype._toPlayerObject = function _toPlayerObject(playerJSON) {
    var player;
    if (this.playerPoolIndex >= this.playerPool.length) {
        player = new Player();
        this.playerPool.push(player);
    } else {
        player = this.playerPool[this.playerPoolIndex];
    }
    player.fromJSON(playerJSON);
    ++this.playerPoolIndex;
    return player;
};

Universe.prototype.getPlanet = function getPlanet(planetId) {
    var i, planet, planetsArr;
    planetsArr = this._planetsArray;

    for (i = 0; planet = planetsArr[i]; ++i) {
        if (planet.getId() == planetId) {
            return planet;
        }
    }
    return null;
};

Universe.prototype.getPlayer = function getPlayer(playerId) {
    if (!this._players.hasOwnProperty(playerId)) return null;
    return this._players[playerId];
};

// without the .slice-ing you'll get into trouble with in-memory functions, e.g. when sorting the array you're given while iterating over it

Universe.prototype.getActivePlayers = function getActivePlayers() {
    return this._playersArray.slice();
};

Universe.prototype.getAllPlanets = function getAllPlanets() {
    return this._planetsArray.slice();
};

Universe.prototype.getPlanets = function getPlanets(player) {
    if (!this._planetsPerPlayer.hasOwnProperty(player.id)) return [];
    return this._planetsPerPlayer[player.id].slice();
};

Universe.prototype.getNeutralPlanets = function getNeutralPlanets() {
    if (!this._planetsPerPlayer.hasOwnProperty(this._neutralPlayerId)) return [];
    return this._planetsPerPlayer[this._neutralPlayerId].slice();
};

Universe.prototype.getEnemyPlanets = function getEnemyPlanets(player) {
    var playerId,
        planets,
        id,
        enemyPlanets,
        planPerPlayer;

    id = player.id;

    if (!this._planetCache.hasOwnProperty(id)) {
        enemyPlanets = [];
        planPerPlayer = this._planetsPerPlayer;

        for (playerId in planPerPlayer) {
            if (playerId != id) {
                planets = planPerPlayer[playerId];
                enemyPlanets.push.apply(enemyPlanets, planets);
            }
        }
        this._planetCache[id] = enemyPlanets;
    }

    enemyPlanets = this._planetCache[id];
    return enemyPlanets.slice();
};

Universe.prototype.getAllFleets = function getAllFleets() {
    return this._fleetsArray.slice();
};

Universe.prototype.getFleets = function getFleets(player) {
    if (!this._fleetsPerPlayer.hasOwnProperty(player.id)) return [];
    return this._fleetsPerPlayer[player.id].slice();
};

Universe.prototype.getEnemyFleets = function getEnemyFleets(player) {
    var playerId, fleets, id, enemyFleets, fleetsPerPlayer;
    id = player.id;

    if (!this._fleetCache.hasOwnProperty(id)) {
        enemyFleets = [];
        fleetsPerPlayer = this._fleetsPerPlayer;

        for (playerId in fleetsPerPlayer) {
            if (playerId != id) {
                fleets = fleetsPerPlayer[playerId];
                enemyFleets.push.apply(enemyFleets, fleets);
            }
        }
        this._fleetCache[id] = enemyFleets;
    }
    enemyFleets = this._fleetCache[id];
    return enemyFleets.slice();
};

Universe.prototype.getForces = function getForces(player) {
    if (!this._playersJSON.hasOwnProperty(player.id)) return 0;
    return this._playersJSON[player.id][_STATE_KEYS["forces"]];
};

Universe.prototype.getAirForces = function getAirForces(player) {
    if (!this._playersJSON.hasOwnProperty(player.id)) return 0;
    return this._playersJSON[player.id][_STATE_KEYS["airForces"]];
};

Universe.prototype.getGroundForces = function getGroundForces(player) {
    if (!this._playersJSON.hasOwnProperty(player.id)) return 0;
    return this._playersJSON[player.id][_STATE_KEYS["groundForces"]];
};

Universe.prototype.sortByDistance = function sortByDistance(planet, planets, reverse) {
    if (reverse) {
        planets.sort(this._sortByDistRev.bind(planet));
    } else {
        planets.sort(this._sortByDist.bind(planet));
    }
};

Universe.prototype.sortByDistanceToDestination = function sortByDistanceToDestination(fleets, reverse) {
    if (reverse) {
        fleets.sort(this._sortByDistToDestRev);
    } else {
        fleets.sort(this._sortByDistToDest);
    }
};

Universe.prototype.sortByRecruitingPower = function sortByRecruitingPower(planets, reverse) {
    if (reverse) {
        planets.sort(this._sortByRecrRev);
    } else {
        planets.sort(this._sortByRecr);
    }
};

Universe.prototype.sortByForces = function sortByForces(planetsOrFleets, reverse) {
    if (reverse) {
        planetsOrFleets.sort(this._sortByForcesRev);
    } else {
        planetsOrFleets.sort(this._sortByForces);
    }
};

Universe.prototype.sortPlayersByForces = function sortPlayersByForces(players, reverse) {
    if (reverse) {
        players.sort(this._sortPlayersByForcesRev.bind(this));
    } else {
        players.sort(this._sortPlayersByForces.bind(this));
    }
};

Universe.prototype.registerFleet = function registerFleet(sourceId, destinationId, forces) {
    var json = {};
    json[_STATE_KEYS["sourceId"]] = sourceId;
    json[_STATE_KEYS["destinationId"]] = destinationId;
    json[_STATE_KEYS["forces"]] = forces;
    this.newFleets.push(json);
};

Universe.prototype._sortByRecr = function _sortByRecr(a, b) {
    return a.getRecruitingPerStep() - b.getRecruitingPerStep();
};

Universe.prototype._sortByRecrRev = function _sortByRecrRev(a, b) {
    return b.getRecruitingPerStep() - a.getRecruitingPerStep();
};

Universe.prototype._sortByDistToDest = function _sortByDistToDest(a, b) {
    return a.distanceToDestination() - b.distanceToDestination();
};

Universe.prototype._sortByDistToDestRev = function _sortByDistToDestRev(a, b) {
    return b.distanceToDestination() - a.distanceToDestination();
};

Universe.prototype._sortByDist = function _sortByDist(a, b) {
    return this.distanceTo(a) - this.distanceTo(b);
};

Universe.prototype._sortByDistRev = function _sortByDistRev(a, b) {
    return this.distanceTo(b) - this.distanceTo(a);
};

Universe.prototype._sortByForces = function _sortByForces(a, b) {
    return a.getForces() - b.getForces();
};

Universe.prototype._sortByForcesRev = function _sortByForcesRev(a, b) {
    return b.getForces() - a.getForces();
};

Universe.prototype._sortPlayersByForces = function _sortPlayersByForces(a, b) {
    return this.getForces(a) - this.getForces(b);
};

Universe.prototype._sortPlayersByForcesRev = function _sortPlayersByForcesRev(a, b) {
    return this.getForces(b) - this.getForces(a);
};