Universe: function Universe(initialPlayers, planetCount, width, height) {
    var players = initialPlayers;
    var neutralPlanetCount = planetCount - players.length;
    var determineActivePlayers = function determineActivePlayers() {
        var activePlayers = [];

        for (var i = 0; i < players.length; i++) {
            var planetCount = this.getPlanets(players[i]).length;
            var fleetCount = this.getFleets(players[i]).length;
            if (planetCount + fleetCount > 0) activePlayers.push(players[i]);
        }

        return activePlayers;
    }.bind(this);

    var neutralPlayer = new NeutralPlayer();
    this.getNeutralPlayer = function getNeutralPlayer() {
        return neutralPlayer;
    };

    this.width = width;
    this.height = height;

    var planetStepFuncs = [];
    this.registerPlanetStepFunction = function registerPlanetStepFunction(stepFunc) {
        planetStepFuncs.push(stepFunc);
    };

    // create main planets for players
    var planets = [];

    var createNewPlanet = function createNewPlanet(recruitingPerStep, owner, initialForces, minDistance) {
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
            for (var i = 0; i < planets.length; i++) {
                if (planets[i].collidesWith(planet, minDistance)) {
                    collides = true;
                    break;
                }
            }
            if (!collides) return planet;
        }
    }.bind(this);

    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        var planet = createNewPlanet(this.mainPlanetRecruitingPerStep, player, this.mainPlanetInitialForces, this.minDistanceFromMainPlanet);
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
        var fleetsAsArray = [];
        for (var fleetId in fleets) {
            fleetsAsArray.push(fleets[fleetId]);
        };
        return fleetsAsArray;
    };

    var newFleets = {};
    var newFleetStepFuncs = {};

    this.registerFleet = function registerFleet(fleet, stepFunc) {
        var flightId = fleet.getId();
        newFleets[flightId] = fleet;
        newFleetStepFuncs[flightId] = stepFunc;
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

        var activePlayers = determineActivePlayers();
        shuffleArray(activePlayers);

        for (var i = 0; i < activePlayers.length; i++) {
            activePlayers[i].think(this);
        }

        for (var fleetId in newFleets) {
            var fleet = newFleets[fleetId];
            var fleetStepFunc = newFleetStepFuncs[fleetId];

            fleets[fleetId] = fleet;
            fleetStepFuncs[fleetId] = fleetStepFunc;
        }
        newFleets = {};
        newFleetStepFuncs = {};

        this.getActivePlayers = function getActivePlayers() {
            var getSafeClone = function(a) {
                return a.safeClone();
            };
            var copy = activePlayers.slice();
            return copy.map(getSafeClone);
        };
    }.bind(this);

    this.exportState = function exportState() {
        var exportArray = function exportArray(arr) {
            return arr.map(function(value) {
                return value.exportState();
            });
        };

        var players = this.getActivePlayers();
        players.push(this.getNeutralPlayer());
        var exportedPlanets = {};
        var exportedFleets = {};

        for (var i = 0; i < players.length; i++) {
            var player = players[i];
            var color = player.color;

            var planets = this.getPlanets(player);
            if (planets.length > 0) exportedPlanets[color] = exportArray(planets);

            var fleets = this.getFleets(player);
            if (fleets.length > 0) exportedFleets[color] = exportArray(fleets);
        }

        var exportedUniverse = {
            "activePlayersCount": players.length - 1,
            "planets": exportedPlanets,
            "fleets": exportedFleets
        };
        return exportedUniverse;
    };
};
Universe.prototype.mainPlanetRecruitingPerStep = 6;
Universe.prototype.mainPlanetInitialForces = 300;
Universe.prototype.minDistanceFromMainPlanet = 100;
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

Universe.prototype.sortByDistanceToTarget = function sortByDistanceToTarget(fleets) {
    var sortByDist = function sortByDist(a, b) {
        var distA = a.distanceToTarget();
        var distB = b.distanceToTarget();
        return distA - distB;
    };
    fleets.sort(sortByDist);
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
    return this.getAirForces(player) + this.getGroundForces(player);
};
