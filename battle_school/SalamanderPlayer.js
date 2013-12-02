importScripts("battle_school/RatPlayer.js");

SalamanderPlayer: function SalamanderPlayer() {
    this.color = [143, 188, 143]; //DarkSeaGreen
    this.round = 0;
    this.initialize();
    this.setStrategies();
};
SalamanderPlayer.prototype = new Player();
SalamanderPlayer.prototype.constructor = SalamanderPlayer;

SalamanderConquerFirstCornerStrategy: function SalamanderConquerFirstCornerStrategy() {};
SalamanderConquerFirstCornerStrategy.prototype = new RatPlayerStrategy();
SalamanderConquerFirstCornerStrategy.prototype.constructor = SalamanderConquerFirstCornerStrategy;
SalamanderConquerFirstCornerStrategy.prototype.getClusterSize = function getClusterSize(universe) {
    return 6;
};

SalamanderConquerFirstCornerStrategy.prototype.think = function think(universe) {
    var i,
        j,
        myPlanets,
        myLength,
        minFleetSize,
        reserveFactor,
        cornerCoords,
        myPlanet,
        available,
        targets,
        cornerTargets,
        targetsLength,
        topEnemy,
        top,
        all,
        target,
        fleetSize;

    myPlanets = universe.getPlanets(this.player);
    myLength = myPlanets.length;
    if (myLength == 0) return;

    minFleetSize = 20;
    reserveFactor = 5;

    cornerCoords = this.getClosestCorner(universe, myPlanets);
    cornerTargets = universe.getEnemyPlanets(this.player);
    if (cornerTargets.length == 0) return;
    this.sortByDistanceToCoords(cornerTargets, cornerCoords);

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < minFleetSize) continue;

        targets = this.getHostileCluster(universe, myPlanet);
        targetsLength = targets.length;

        if (targetsLength == 0) return;
        this.sortByDistanceToCoords(targets, cornerCoords);

        topEnemy = [];
        all = true;
        for (j = 0; target = targets[j]; ++j) {
            top = this.inTopForceEnemyPlanets(universe, target, 5);
            topEnemy.push(top);
            if (!top) all = false;
        }

        if (all) continue;

        for (j = 0; target = targets[j]; ++j) {
            if (available < minFleetSize) break;

            if (topEnemy[j]) continue;
            fleetSize = this.getNeededForces(universe, target);
            if (fleetSize > available) continue;
            if (fleetSize <= 0) continue;

            fleetSize = Math.max(minFleetSize, fleetSize);

            this.player.sendFleet(myPlanet, target, fleetSize);
            available -= fleetSize;
        }

        for (j = 0; target = cornerTargets[j]; ++j) {
            if (available < minFleetSize) break;

            // it's possible that fleets have already been sent to the planet, in which case the result is not accurate
            fleetSize = this.getNeededForces(universe, target);
            if (fleetSize > available) continue;
            if (fleetSize <= 0) continue;

            this.player.sendFleet(myPlanet, target, fleetSize);
            available -= fleetSize;
        }
    }
};

SalamanderConquerClosestCornerStrategy: function SalamanderConquerClosestCornerStrategy() {};
SalamanderConquerClosestCornerStrategy.prototype = new RatPlayerMiddleStrategy();
SalamanderConquerClosestCornerStrategy.prototype.constructor = SalamanderConquerClosestCornerStrategy;

SalamanderConquerClosestCornerStrategy.prototype.getClusterSize = function getClusterSize(universe) {
    var activePlayers = universe.getActivePlayers();
    if (activePlayers.length == 2) {
        return 5;
    } else {
        return Math.max(5, 10 - activePlayers.length);
    }
};

SalamanderConquerClosestCornerStrategy.prototype.think = function think(universe) {
    var i,
        j,
        reserveFactor,
        minFleetSizes,
        myPlanets,
        enemyPlanets,
        needsHelp,
        free,
        myPlanet,
        neededForces,
        victim,
        available,
        backup,
        source,
        order,
        orders,
        destination,
        fleetSize,
        cluster,
        hostile,
        coords,
        destCoords;

    minFleetSizes = {
        "defend": 10,
        "attack": 20,
        "backup": 20
    };
    reserveFactor = 10;

    myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length == 0) return;

    needsHelp = [];
    free = [];

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        neededForces = this.getNeededForces(universe, myPlanet);

        if (neededForces > 0) {
            victim = {
                "planet": myPlanet,
                "neededForces": neededForces
            };
            needsHelp.push(victim);

        } else {

            available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
            if (available > Math.min(minFleetSizes.defend, minFleetSizes.attack)) {
                backup = {
                    "planet": myPlanet,
                    "available": available
                };
                free.push(backup);
            }
        }
    }

    if (free.length == 0) return;

    for (i = 0; backup = free[i]; ++i) {
        source = backup.planet;
        cluster = this.getFriendlyCluster(universe, source);
        coords = this.getClosestCorner(universe, myPlanets);
        this.sortByDistanceToCoords(cluster, coords);

        myPlanet = cluster[0];
        hostile = this.getHostileCluster(universe, myPlanet);
        if (hostile.length == 0) return;

        destCoords = this.getClosestCorner(universe, hostile);

        available = backup.available;

        orders = this.getOrders(universe, source, available, minFleetSizes, needsHelp, destCoords);
        for (j = 0; order = orders[j]; ++j) {
            destination = order.destination;
            fleetSize = order.fleetSize;
            this.player.sendFleet(source, destination, fleetSize);
        }
    }
};


SalamanderDefensiveStrategy: function SalamanderDefensiveStrategy() {};
SalamanderDefensiveStrategy.prototype = new RatPlayerStrategy();
SalamanderDefensiveStrategy.prototype.constructor = SalamanderDefensiveStrategy;
SalamanderDefensiveStrategy.prototype.think = function think(universe) {
    var i,
        fleetSize,
        reserveFactor,
        support,
        myPlanets,
        myPlanet,
        myForces,
        myRecruiting,
        available,
        target,
        destination,
        targetForces,
        fleetSize,
        enemyPlanets;

    fleetSize = 25;
    reserveFactor = 20;
    support = 3;

    myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length == 0) return;


    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        myForces = myPlanet.getForces();
        myRecruiting = myPlanet.getRecruitingPerStep();

        available = myForces - reserveFactor * myRecruiting;
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        target = enemyPlanets[0];
        destination = this.getNextDestination(universe, myPlanet, target, support);

        targetForces = target.getForces();
        if (target.equals(destination)) {
            if (targetForces > available && target.getRecruitingPerStep() >= myRecruiting) continue;
        }

        fleetSize = Math.ceil(targetForces / fleetSize) * fleetSize;
        this.player.sendFleet(myPlanet, destination, Math.min(available, fleetSize));
    }
};

SalamanderDefensiveStrategy.prototype.getLastHop = function getLastHop(universe, source, target, support) {
    var i,
        minDist,
        destination,
        myPlanets,
        myPlanet,
        dist;

    if (typeof target === "undefined") return;
    minDist = Math.pow(source.distanceTo(target), support);
    destination = target;

    myPlanets = universe.getPlanets(this);

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        if (myPlanet.equals(source)) continue;

        dist = Math.pow(myPlanet.distanceTo(target), support) + source.distanceTo(myPlanet);
        if (dist < minDist) {
            minDist = dist;
            destination = myPlanet;
        }
    }
    return destination;
};

SalamanderDefensiveStrategy.prototype.getNextDestination = function getNextDestination(universe, source, target, support) {
    var lastHop, hopBeforeLast;

    if (typeof target === "undefined") return;

    lastHop = this.getLastHop(universe, source, target, support);
    hopBeforeLast = this.getLastHop(universe, source, lastHop, support);

    while (!hopBeforeLast.equals(lastHop)) {
        lastHop = hopBeforeLast;
        hopBeforeLast = this.getLastHop(universe, source, lastHop, support);
    }
    return lastHop;
};

SalamanderSpreadStrategy: function SalamanderSpreadStrategy() {};
SalamanderSpreadStrategy.prototype = new RatPlayerStrategy();
SalamanderSpreadStrategy.prototype.constructor = SalamanderSpreadStrategy;
SalamanderSpreadStrategy.prototype.getClusterSize = function getClusterSize(universe) {
    return 10;
};

SalamanderSpreadStrategy.prototype.think = function think(universe) {
    var i,
        j,
        reserveFactor,
        fleetSize,
        myPlanets,
        myPlanet,
        available,
        target,
        hostile,
        recruitingCenter;

    reserveFactor = 10;
    fleetSize = 20;
    myPlanets = universe.getPlanets(this.player);

    if (myPlanets.length == 0) return;
    recruitingCenter = this.getRecruitmentTarget(universe);

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < fleetSize) continue;

        hostile = this.getHostileCluster(universe, myPlanet);
        this.sortByDistanceToCoords(hostile, recruitingCenter);

        for (j = 0; target = hostile[j]; ++j) {
            if (available < fleetSize) break;

            this.player.sendFleet(myPlanet, target, fleetSize);
            available -= fleetSize;
        }
    }
};


SalamanderPlayer.prototype.setStrategies = function setStrategies() {
    this.strategies =  {
        "spread": new SalamanderSpreadStrategy().setPlayer(this),
        "conquerFirstCorner": new SalamanderConquerFirstCornerStrategy().setPlayer(this),
        "conquerRecruitingCenter": new RatPlayerMiddleStrategy().setPlayer(this),
        "conquerClosestCorner": new SalamanderConquerClosestCornerStrategy().setPlayer(this),     // adapted from RatPlayerMiddleStrategy - always try to limit the front-line by attacking the closest corner
        "albatross": new SalamanderDefensiveStrategy().setPlayer(this),                         // Albatross - able to draw or win instead of lose in some situations, esp. against SupportNetworkPlayer
        "attackNearestEnemy": new RatPlayerFinalStrategy().setPlayer(this)       // AttackNearestEnemy - simple, but quick and effective for dealing the finishing blow
    };
};

SalamanderPlayer.prototype.think = function think(universe) {
    var i,
        activePlayers,
        initialRounds,
        finalFactor,
        defensiveFactor,
        myPlanets,
        strategy,
        planets,
        myForces,
        otherForces,
        maxForces,
        other,
        playersLen,
        planPerPlayer;

    initialRounds = 25;
    finalFactor = 3/4;
    defensiveFactor = 2/3;

    ++this.round;

    activePlayers = universe.getActivePlayers();
    playersLen = activePlayers.length;

    myPlanets = universe.getPlanets(this);
    planets = universe.getAllPlanets();

    planPerPlayer = planets.length / playersLen;

    strategy = null;
    if (this.round < initialRounds) {
        if (playersLen > 3) {
            strategy = "conquerFirstCorner";
        } else {
            strategy = "spread";
        }

    } else {

        myForces = universe.getForces(this);
        otherForces = 0;

        universe.sortPlayersByForces(activePlayers, true);
        maxForces = activePlayers[0];

        for (i = 0; other = activePlayers[i]; ++i) {
            if (other.equals(this)) continue;

            otherForces += universe.getForces(other);
        }

        if (finalFactor * myForces > otherForces && myPlanets.length > planPerPlayer) {
            strategy = "attackNearestEnemy";

        } else if (defensiveFactor * maxForces > myForces && myPlanets.length < 20) {
            strategy = "albatross";

        } else {

            if (playersLen > 2 && playersLen < 7) {
                strategy = "conquerClosestCorner";
            } else {
                strategy = "conquerRecruitingCenter";
            }

        }
    }
    this.strategies[strategy].think(universe);
};

var _constructor = SalamanderPlayer;