importScripts("helper.js", "player_slave.js", "planet_slave.js", "fleet_slave.js");

var _initialized = false;
var _player = null;
var _workerId = null;
var _playerId = null;
var _playerFile = null;
var _universe = null;

onmessage = function(oEvent) {
    var action = oEvent.data.action;

    if (action === "think") {

        _universe._fromJSON(oEvent.data.universe);
        _player.think(_universe);

        postMessage({
            "workerId": _workerId,
            "action": "registerFleets",
            "newFleets": _universe.newFleets
        });

    } else if (action === "initialize") {

        if (_initialized) return;
        _workerId = oEvent.data.workerId;
        _playerId = oEvent.data.playerId;
        _playerFile = oEvent.data.playerFile;

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
    } else if (action === "die") {
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
    this.playerPoolIndex = 0;
    this.planetPoolIndex = 0;
    this.fleetPoolIndex = 0;

    this.width = universeState[_STATE_KEYS["width"]];
    this.height = universeState[_STATE_KEYS["height"]];
    this.fleetMovementPerStep = universeState[_STATE_KEYS["fleetMovementPerStep"]];

    this.newFleets = [];

    this._players = {};
    this._playersArray = [];
    this._playersJSON = {};
    this._planetsPerPlayer = {};
    this._planetsArray = [];
    this._fleetsPerPlayer = {};
    this._fleetsArray = [];
    this._neutralPlayerId = null;

    this._playersJSON = universeState[_STATE_KEYS["players"]];
    var planetsJSON = universeState[_STATE_KEYS["planets"]];
    var fleetsJSON = universeState[_STATE_KEYS["fleets"]];

    for (var playerId in this._playersJSON) {
        var playerJSON = this._playersJSON[playerId];
        var player = this._toPlayerObject(playerJSON);

        if (player.isNeutral) {
            this._neutralPlayerId = playerId;
        } else {
            this._playersArray.push(player);
        }

        this._players[playerId] = player;

        if (planetsJSON.hasOwnProperty(playerId)) {
            var playersPlanetsJSON = planetsJSON[playerId];
            var playersPlanets = playersPlanetsJSON.map(this._toPlanetObject.bind(this));
            this._planetsPerPlayer[playerId] = playersPlanets;
            this._planetsArray.push.apply(this._planetsArray, playersPlanets);
        } else {
            this._planetsPerPlayer[playerId] = [];
        }
    }

    for (var i = 0; i < this._playersArray.length; ++i) {
        var player = this._playersArray[i];
        var playerId = player.id;

        if (fleetsJSON.hasOwnProperty(playerId)) {
            var playersFleetsJSON = fleetsJSON[playerId];
            var playersFleets = playersFleetsJSON.map(this._toFleetObject.bind(this));
            this._fleetsPerPlayer[playerId] = playersFleets;
            this._fleetsArray.push.apply(this._fleetsArray, playersFleets);
        } else {
            this._fleetsPerPlayer[playerId] = [];
        }
    }
};

// create wrappers for the json, with additional functions for use by the players
// recycling objects to avoid unnecessary garbage collection, which tends to freeze the animation
Universe.prototype._toPlanetObject = function _toPlanetObject(planetJSON) {
    var planet;
    if (this.planetPoolIndex >= this.planetPool.length) {
        planet = new Planet(planetJSON, this);
        this.planetPool.push(planet);
    } else {
        planet = this.planetPool[this.planetPoolIndex];
        planet._setState(planetJSON);
    }
    ++this.planetPoolIndex;
    return planet;
};

Universe.prototype._toFleetObject = function _toFleetObject(fleetJSON) {
    var fleet;
    if (this.fleetPoolIndex >= this.fleetPool.length) {
        fleet = new Fleet(fleetJSON, this);
        this.fleetPool.push(fleet);
    } else {
        fleet = this.fleetPool[this.fleetPoolIndex];
        fleet._setState(fleetJSON);
    }
    ++this.fleetPoolIndex;
    return fleet;
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

Universe.prototype._getPlanet = function _getPlanet(planetId) {
    for (var i = 0; i < this._planetsArray.length; ++i) {
        var planet = this._planetsArray[i];
        if (planet.getId() == planetId) {
            return planet;
        }
    }
    return null;
};

Universe.prototype._getPlayer = function _getPlayer(playerId) {
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
    var enemyPlanets = [];
    for (var playerId in this._planetsPerPlayer) {
        if (playerId !== player.id) {
            var planets = this._planetsPerPlayer[playerId];
            enemyPlanets.push.apply(enemyPlanets, planets);
        }
    }
    return enemyPlanets;
};

Universe.prototype.getAllFleets = function getAllFleets() {
    return this._fleetsArray.slice();
};

Universe.prototype.getFleets = function getFleets(player) {
    if (!this._fleetsPerPlayer.hasOwnProperty(player.id)) return [];
    return this._fleetsPerPlayer[player.id].slice();
};

Universe.prototype.getEnemyFleets = function getEnemyFleets(player) {
    var enemyFleets = [];
    for (var playerId in this._fleetsPerPlayer) {
        if (playerId !== player.id) {
            var fleets = this._fleetsPerPlayer[playerId];
            enemyFleets.push.apply(enemyFleets, fleets);
        }
    }
    return enemyFleets;
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
    var recrA = a.getRecruitingPerStep();
    var recrB = b.getRecruitingPerStep();
    return recrA - recrB;
};

Universe.prototype._sortByRecrRev = function _sortByRecrRev(a, b) {
    var recrA = a.getRecruitingPerStep();
    var recrB = b.getRecruitingPerStep();
    return recrB - recrA;
};

Universe.prototype._sortByDistToDest = function _sortByDistToDest(a, b) {
    var distA = a.distanceToDestination();
    var distB = b.distanceToDestination();
    return distA - distB;
};

Universe.prototype._sortByDistToDestRev = function _sortByDistToDestRev(a, b) {
    var distA = a.distanceToDestination();
    var distB = b.distanceToDestination();
    return distB - distA;
};

Universe.prototype._sortByDist = function _sortByDist(a, b) {
    var distA = this.distanceTo(a);
    var distB = this.distanceTo(b);
    return distA - distB;
};

Universe.prototype._sortByDistRev = function _sortByDistRev(a, b) {
    var distA = this.distanceTo(a);
    var distB = this.distanceTo(b);
    return distB - distA;
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