importScripts("helper.js", "player_slave.js", "planet_slave.js", "fleet_slave.js");

var _initialized = false;
var _player = null;
var _workerId = null;
var _playerId = null;
var _playerFile = null;

onmessage = function(oEvent) {
    var action = oEvent.data.action;

    if (action === "think") {

        var universeJSON = oEvent.data.universe;
        var universe = new Universe(universeJSON);
        _player.think(universe);

        postMessage({
            "workerId": _workerId,
            "action": "registerFleets",
            "newFleets": universe.newFleets
        });

    } else if (action === "initialize") {

        if (_initialized) return;
        _workerId = oEvent.data.workerId;
        _playerId = oEvent.data.playerId;
        _playerFile = oEvent.data.playerFile;

        importScripts(_playerFile);
        _player = new _constructor();
        _player._setId(_playerId);
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

Universe: function Universe(universeState) {
    this._initialize(universeState);
};

Universe.prototype._initialize = function _initialize(universeState) {
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
        var player = new Player();
        player.fromJSON(playerJSON);

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

    for (var i = 0; i < this._playersArray.length; i++) {
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
Universe.prototype._toPlanetObject = function _toPlanetObject(planetJSON) {
    return new Planet(planetJSON, this);
};

Universe.prototype._toFleetObject = function _toFleetObject(fleetJSON) {
    return new Fleet(fleetJSON, this);
};

Universe.prototype._getPlanet = function _getPlanet(planetId) {
    for (var i = 0; i < this._planetsArray.length; i++) {
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

Universe.prototype.sortByDistance = function sortByDistance(planet, planets) {
    var sortByDist = function sortByDist(a, b) {
        var distA = planet.distanceTo(a);
        var distB = planet.distanceTo(b);
        return distA - distB;
    };
    planets.sort(sortByDist);
};

Universe.prototype.sortByDistanceToDestination = function sortByDistanceToDestination(fleets) {
    var sortByDist = function sortByDist(a, b) {
        var distA = a.distanceToDestination();
        var distB = b.distanceToDestination();
        return distA - distB;
    };
    fleets.sort(sortByDist);
};

Universe.prototype.sortByRecruitingPower = function sortByRecruitingPower(planets) {
    var sortByRecr = function sortByRecr(a, b) {
        var recrA = a.getRecruitingPerStep();
        var recrB = b.getRecruitingPerStep();
        return recrB - recrA;
    };
    planets.sort(sortByRecr);
};

Universe.prototype.registerFleet = function registerFleet(sourceId, destinationId, forces) {
    var json = {};
    json[_STATE_KEYS["sourceId"]] = sourceId;
    json[_STATE_KEYS["destinationId"]] = destinationId;
    json[_STATE_KEYS["forces"]] = forces;
    this.newFleets.push(json);
};