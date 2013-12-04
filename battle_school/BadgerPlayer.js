importScripts("battle_school/SalamanderPlayer.js");


BadgerPlayer: function BadgerPlayer() {
    this.color = [222, 184, 135]; //BurlyWood
    this.initialize();
    this.setStrategies();
};
BadgerPlayer.prototype = new Player();
BadgerPlayer.prototype.constructor = BadgerPlayer;

BadgerPlayerStrategy: function BadgerPlayerStrategy() {};
BadgerPlayerStrategy.prototype = new RatPlayerStrategy();
BadgerPlayerStrategy.prototype.constructor = BadgerPlayerStrategy;

BadgerPlayerStrategy.prototype.setupRound = function setupRound(universe) {
    this.universe = universe;
    this.reserveCache = {};
    this.stepsToEnemyCache = {};
    this.inTopCache = {};
    this.topCache = [];
};

BadgerPlayerStrategy.prototype.getStepsToEnemy = function getStepsToEnemy(planet) {
    var planetId,
        hostile,
        nearest,
        stepsTo,
        attackingFleets;

    planetId = planet.getId();

    if (!this.stepsToEnemyCache.hasOwnProperty(planetId)) {

        hostile = this.getHostileCluster(planet, true);
        if (hostile.length < 0) return 0;

        if (planet.ownerEquals(this.player)) {
            nearest = hostile[0];
        } else {
            if (hostile.length < 2) return 0;
            nearest = hostile[1];
        }

        stepsTo = nearest.fleetStepsTo(planet);

        attackingFleets = planet.getAttackingFleets();
        if (attackingFleets.length > 1) {
            this.universe.sortByDistanceToDestination(attackingFleets);
            stepsTo = Math.min(stepsTo, attackingFleets[0].stepsToDestination());
        }
        this.stepsToEnemyCache[planetId] = stepsTo;
    }
    return this.stepsToEnemyCache[planetId];
};

BadgerPlayerStrategy.prototype.getReserveFactor = function getReserveFactor(planet) {
    var planetId,
        stepsTo,
        reserveFactor;

    planetId = planet.getId();

    if (!this.reserveCache.hasOwnProperty(planetId)) {
        stepsTo = this.getStepsToEnemy(planet);
        reserveFactor = Math.max(0, 25 - stepsTo);
        this.reserveCache[planetId] = reserveFactor;
    }
    return this.reserveCache[planetId];
};

BadgerPlayerStrategy.prototype.getNeededMap = function getNeededMap(enemyPlanets) {
    var i, neededMap, needed, target;
    neededMap = {};

    for (i = 0; target = enemyPlanets[i]; ++i) {
        needed = this.getNeededForces(target);
        neededMap[target.getId()] = needed;
    }
    return neededMap;
};

BadgerAttackBestRatioStrategy: function BadgerAttackBestRatioStrategy() {};
BadgerAttackBestRatioStrategy.prototype = new BadgerPlayerStrategy();
BadgerAttackBestRatioStrategy.prototype.constructor = BadgerAttackBestRatioStrategy;
BadgerAttackBestRatioStrategy.prototype.think = function think(universe) {
    var i,
        myPlanet,
        myPlanets,
        enemyPlanets,
        needed,
        available,
        reserveFactor,
        target,
        fleetSize,
        cluster,
        destination,
        neededMap,
        desiredFleetSize,
        desiredReserveFactor;

    myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length == 0) return;

    this.setupRound(universe);
    neededMap = this.getNeededMap(enemyPlanets);

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        needed = this.getNeededForces(myPlanet);
        if (needed > 0) continue;

        reserveFactor = this.getReserveFactor(myPlanet);
        available = Math.min((-needed), myPlanet.getForces()) - reserveFactor * myPlanet.getRecruitingPerStep();

        while (available > 5) {
            target = this.getTarget(myPlanet, enemyPlanets, neededMap);
            if (typeof target === "undefined") break;

            cluster = this.getFriendlyCluster(target);
            destination = cluster[0];

            desiredReserveFactor = this.getReserveFactor(target);
            desiredFleetSize = neededMap[target.getId()] + desiredReserveFactor * target.getRecruitingPerStep();
            fleetSize = Math.min(desiredFleetSize, available);

            if (destination.equals(myPlanet)) {
                destination = target;
                neededMap[target.getId()] -= fleetSize;
            }
            this.player.sendFleet(myPlanet, destination, fleetSize);
            available -= fleetSize;
        }
    }
};

BadgerAttackBestRatioStrategy.prototype.getTarget = function getTarget(source, enemyPlanets, neededMap) {
    var i,
        curDist,
        curRatio,
        curTarget,
        target,
        ratio,
        dist,
        needed;

    curRatio = -Infinity;
    curDist = Infinity;

    for (i = 0; target = enemyPlanets[i]; ++i) {
        needed = neededMap[target.getId()];

        if (needed <= 0) continue;

        ratio = target.getRecruitingPerStep() / needed;
        if (ratio < curRatio)  continue;

        dist = source.distanceTo(target);
        if (dist > curDist) continue;

        curDist = dist;
        curRatio = ratio;
        curTarget = target;
    }

    return curTarget;
};

BadgerAttackFirstCorner: function BadgerAttackFirstCorner() {};
BadgerAttackFirstCorner.prototype = new BadgerPlayerStrategy();
BadgerAttackFirstCorner.prototype.constructor = BadgerAttackFirstCorner;

BadgerAttackFirstCorner.prototype.think = function think(universe) {
    var i,
        myPlanet,
        myPlanets,
        enemyPlanets,
        needed,
        available,
        reserveCount,
        target,
        fleetSize,
        cluster,
        destination,
        neededMap,
        desiredFleetSize,
        corner,
        desiredReserveFactor;

    myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length == 0) return;

    this.setupRound(universe);
    corner = this.getClosestCorner(myPlanets);
    neededMap = this.getNeededMap(enemyPlanets);

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        needed = this.getNeededForces(myPlanet);
        if (needed > 0) continue;

        reserveCount = this.getReserveFactor(myPlanet);
        available = (-needed) - reserveCount * myPlanet.getRecruitingPerStep();

        while (available > 5) {
            target = this.getTarget(myPlanet, corner, enemyPlanets, neededMap);
            if (typeof target === "undefined") break;

            cluster = this.getFriendlyCluster(target);
            destination = cluster[0];

            desiredReserveFactor = this.getReserveFactor(target);
            desiredFleetSize = neededMap[target.getId()] + desiredReserveFactor * target.getRecruitingPerStep();
            fleetSize = Math.min(desiredFleetSize, available);

            if (destination.equals(myPlanet)) {
                destination = target;
                neededMap[target.getId()] -= fleetSize;
            }
            this.player.sendFleet(myPlanet, destination, fleetSize);
            available -= fleetSize;

            if (available <= 0) break;
        }
    }
};

BadgerAttackFirstCorner.prototype.getTarget = function getTarget(source, corner, enemyPlanets, neededMap) {
    var i,
        curDist,
        curRatio,
        curTarget,
        target,
        ratio,
        distCorner,
        distSource,
        dist,
        needed;

    curRatio = -Infinity;
    curDist = Infinity;

    for (i = 0; target = enemyPlanets[i]; ++i) {
        needed = neededMap[target.getId()];
        if (needed <= 0) continue;

        ratio = target.getRecruitingPerStep() / needed;
        if (ratio < curRatio)  continue;

        distCorner = target.distanceToCoords(corner.x, corner.y);
        distSource = source.distanceTo(target);
        dist = distCorner + distSource;
        if (dist > curDist) continue;

        curDist = dist;
        curRatio = ratio;
        curTarget = target;
    }

    return curTarget;
};

function BadgerConquerClosestCornerStrategy() {};
BadgerConquerClosestCornerStrategy.prototype = function() {
    var badger = new BadgerPlayerStrategy();
    var salamander = new SalamanderConquerClosestCornerStrategy();
    salamander.getReserveFactor = badger.getReserveFactor;
    salamander.getNeededMap = badger.getNeededMap;
    salamander.setupRound = badger.setupRound;
    salamander.getStepsToEnemy = badger.getStepsToEnemy;
    return salamander;
}();
BadgerConquerClosestCornerStrategy.prototype.constructor = BadgerConquerClosestCornerStrategy;

BadgerConquerClosestCornerStrategy.prototype.getMinFleetSizes = function getMinFleetSizes() {
    return {
        "defend": 5,
        "attack": 5,
        "backup": 5
    }
};


BadgerPlayer.prototype.setStrategies = function setStrategies() {
    this.strategies =  {
        "conquerFirstCorner": new BadgerAttackFirstCorner().setPlayer(this),
        "attackBestRatio": new BadgerAttackBestRatioStrategy().setPlayer(this),
        "conquerRecruitingCenter": new RatPlayerMiddleStrategy().setPlayer(this),
        "conquerClosestCorner": new BadgerConquerClosestCornerStrategy().setPlayer(this),     // adapted from RatPlayerMiddleStrategy - always try to limit the front-line by attacking the closest corner
        "attackNearestEnemy": new RatPlayerFinalStrategy().setPlayer(this)       // AttackNearestEnemy - simple, but quick and effective for dealing the finishing blow
    };
};

BadgerPlayer.prototype.think = function think(universe) {
    var i,
        activePlayers,
        finalFactor,
        myPlanets,
        strategy,
        planets,
        myForces,
        otherForces,
        other,
        playersLen,
        myLen,
        planPerPlayer,
        neutralPlanets;

    finalFactor = 2/3;

    activePlayers = universe.getActivePlayers();
    playersLen = activePlayers.length;

    myPlanets = universe.getPlanets(this);
    myLen = myPlanets.length;
    if (myLen == 0) return;

    planets = universe.getAllPlanets();
    planPerPlayer = planets.length / playersLen;

    strategy = null;
    myForces = universe.getForces(this);
    otherForces = 0;

    universe.sortPlayersByForces(activePlayers, true);
    for (i = 0; other = activePlayers[i]; ++i) {
        if (other.equals(this)) continue;

        otherForces += universe.getForces(other);
    }

    if ((finalFactor * myForces > otherForces) && (myPlanets.length > planPerPlayer)) {
        strategy = "attackNearestEnemy";
    } else {
        neutralPlanets = universe.getNeutralPlanets();

        if ((playersLen > 4) && (myLen < Math.max(10, playersLen)) && (myLen < planPerPlayer)) {
            strategy = "conquerFirstCorner";
        } else {
            if (playersLen > 2 && playersLen < 7) {
                strategy = "conquerClosestCorner";
            } else {
                if (neutralPlanets.length > 5) {
                    strategy = "attackBestRatio";
                } else {
                    strategy = "conquerRecruitingCenter";
                }
            }
        }
    }
    this.strategies[strategy].think(universe);
};

var _constructor = BadgerPlayer;