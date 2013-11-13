importScripts("battle_school/RatPlayer.js");

SalamanderPlayer: function SalamanderPlayer() {
    this.color = "DarkSeaGreen";
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
    return 4;
};

SalamanderConquerFirstCornerStrategy.prototype.think = function think(universe) {
    var myPlanets = universe.getPlanets(this.player);
    var myLength = myPlanets.length;
    if (myLength == 0) return;

    var minFleetSize = 20;
    var reserveFactor = 5;
    var cornerCoords = this.getClosestCorner(universe, myPlanets);

    for (var i = 0; i < myLength; ++i) {

        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < minFleetSize) continue;

        var targets = this.getHostileCluster(universe, myPlanet);
        var targetsLength = targets.length;

        if (targetsLength == 0) return;
        this.sortByDistanceToCoords(targets, cornerCoords);

        var topEnemy = [];
        var all = true;
        for (var j = 0; j < targetsLength; ++j) {
            var target = targets[j];
            var top = this.inTopForceEnemyPlanets(universe, target, 5);
            topEnemy.push(top);
            if (!top) all = false;
        }

        if (all) continue;

        var j = 0;
        while (available > minFleetSize) {
            var index = j++ % targetsLength;
            var target = targets[index];
            if (topEnemy[index]) continue;
            this.player.sendFleet(myPlanet, target, minFleetSize);
            available -= minFleetSize;
        }
    }
};

SalamanderConquerClosestCornerStrategy: function SalamanderConquerClosestCornerStrategy() {};
SalamanderConquerClosestCornerStrategy.prototype = new RatPlayerMiddleStrategy();
SalamanderConquerClosestCornerStrategy.prototype.constructor = SalamanderConquerClosestCornerStrategy;
SalamanderConquerClosestCornerStrategy.prototype.getOrders = function getOrders(universe, source, available, minFleetSizes, needsHelp) {
    var cluster = this.getFriendlyCluster(universe, source);
    var destinations = this.getTargets(universe, source);
    destinations.push.apply(destinations, needsHelp);
    this.prioritize(source, available, destinations);

    var orders = [];
    for (var i = 0; i < destinations.length && available > Math.min(minFleetSizes.defend, minFleetSizes.attack); ++i) {

        var destination = destinations[i];
        var destPlanet = destination.planet;
        if (this.inTopForceEnemyPlanets(universe, destPlanet, 5)) continue;

        var neededForces = destination.neededForces;
        if (neededForces / this.getClusterSize(universe) > available) continue;

        if (destPlanet.ownerEquals(this.player) && (neededForces < minFleetSizes.defend)) continue;


        var stepsTo = source.fleetStepsTo(destPlanet);
        universe.sortByDistance(destPlanet, cluster);

        if (cluster.length > 0 && !destPlanet.isNeutral()) {
            var closestInCluster = cluster[0];
            if (closestInCluster.fleetStepsTo(destPlanet) < stepsTo) {
                destPlanet = closestInCluster;
            }
        }

        var fleetSize = Math.min(neededForces, available);
        var order = {
            "destination": destPlanet,
            "fleetSize": fleetSize
        };

        orders.push(order);
        available -= fleetSize;
        destinations[i].neededForces -= fleetSize;
    }

    if (available > minFleetSizes.backup) {
        var myPlanets = universe.getPlanets(this.player);
        var coords = this.getClosestCorner(universe, myPlanets);
        this.sortByDistanceToCoords(cluster, coords);

        var myPlanet = cluster[0];
        var hostile = this.getHostileCluster(universe, myPlanet);
        if (hostile.length == 0) return;

        var destCoords = this.getClosestCorner(universe, hostile);

        var x = destCoords.x;
        var y = destCoords.y;
        this.sortByDistanceToCoords(cluster, destCoords);
        var destPlanet = cluster[0];
        if (destPlanet.distanceToCoords(x, y) >= source.distanceToCoords(x, y)) destPlanet = source;

        if (destPlanet !== source) {
            var order = {
                "destination": destPlanet,
                "fleetSize": available
            };
            orders.push(order);
        }
    }
    return orders;
};


SalamanderDefensiveStrategy: function SalamanderDefensiveStrategy() {};
SalamanderDefensiveStrategy.prototype = new RatPlayerStrategy();
SalamanderDefensiveStrategy.prototype.constructor = SalamanderDefensiveStrategy;
SalamanderDefensiveStrategy.prototype.think = function think(universe) {
    var fleetSize = 25;
    var reserveFactor = 20;
    var support = 3;

    var myPlanets = universe.getPlanets(this.player);
    var enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length == 0) return;


    for (var i = 0; i < myPlanets.length; ++i) {
        var myPlanet = myPlanets[i];
        var myForces = myPlanet.getForces();
        var myRecruiting = myPlanet.getRecruitingPerStep();

        var available = myForces - reserveFactor * myRecruiting;
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        var target = enemyPlanets[0];
        var destination = this.getNextDestination(universe, myPlanet, target, support);

        var targetForces = target.getForces();
        if (target === destination) {
            if (targetForces > available && target.getRecruitingPerStep() >= myRecruiting) continue;
        }

        var fleetSize = Math.ceil(targetForces / fleetSize) * fleetSize;
        this.player.sendFleet(myPlanet, destination, Math.min(available, fleetSize));
    }
};

SalamanderDefensiveStrategy.prototype.getLastHop = function getLastHop(universe, source, target, support) {
    if (typeof target === "undefined") {
        return;
    }
    var minDist = Math.pow(source.distanceTo(target), support);
    var destination = target;

    var myPlanets = universe.getPlanets(this);

    for (var i = 0; i < myPlanets.length; ++i) {
        var myPlanet = myPlanets[i];
        if (myPlanet === source) continue;

        var dist = Math.pow(myPlanet.distanceTo(target), support) + source.distanceTo(myPlanet);
        if (dist < minDist) {
            minDist = dist;
            destination = myPlanet;
        }
    }
    return destination;
};

SalamanderDefensiveStrategy.prototype.getNextDestination = function getNextDestination(universe, source, target, support) {
    if (typeof target === "undefined") return;
    var lastHop = this.getLastHop(universe, source, target, support);
    var hopBeforeLast = this.getLastHop(universe, source, lastHop, support);

    while (hopBeforeLast !== lastHop) {
        lastHop = hopBeforeLast;
        hopBeforeLast = this.getLastHop(universe, source, lastHop, support);
    }
    return lastHop;
};


SalamanderAttackNearestEnemyStrategy: function SalamanderAttackNearestEnemyStrategy() {};
SalamanderAttackNearestEnemyStrategy.prototype = new RatPlayerStrategy();
SalamanderAttackNearestEnemyStrategy.prototype.constructor = SalamanderAttackNearestEnemyStrategy;

SalamanderAttackNearestEnemyStrategy.prototype.think = function think(universe) {
    var reserveFactor = 10;
    var minFleetSize = 25;

    var myPlanets = universe.getPlanets(this.player);
    var enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length === 0) return;

    var myLength = myPlanets.length;
    for (var i = 0; i < myLength; ++i) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();

        if (available < minFleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        var target = enemyPlanets[0];

        var fleetSize = Math.max(Math.ceil(available / 2), minFleetSize);

        this.player.sendFleet(myPlanet, target, fleetSize);
    }
};

SalamanderSpreadStrategy: function SalamanderSpreadStrategy() {};
SalamanderSpreadStrategy.prototype = new RatPlayerStrategy();
SalamanderSpreadStrategy.prototype.constructor = SalamanderSpreadStrategy;
SalamanderSpreadStrategy.prototype.getClusterSize = function getClusterSize(universe) {
    return 8;
};

SalamanderSpreadStrategy.prototype.think = function think(universe) {
    var reserveFactor = 10;
    var fleetSize = 20;

    var myPlanets = universe.getPlanets(this.player);

    var myLength = myPlanets.length;
    for (var i = 0; i < myLength; ++i) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();

        if (available < fleetSize) continue;

        var hostile = this.getHostileCluster(universe, myPlanet);
        var hostileLength = hostile.length;

        var recruitingCenter = this.getRecruitmentTarget(universe);
        this.sortByDistanceToCoords(hostile, recruitingCenter);

        for (var j = 0; j < hostileLength && available > fleetSize; ++j) {
            var target = hostile[j];
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
        "attackNearestEnemy": new SalamanderAttackNearestEnemyStrategy().setPlayer(this)       // AttackNearestEnemy - simple, but quick and effective for dealing the finishing blow
    };
};

SalamanderPlayer.prototype.think = function think(universe) {
    ++this.round;
    var activePlayers = universe.getActivePlayers();
    var playersLength = activePlayers.length;
    var initialRounds = 25;
    var finalFactor = 3/4;
    var defensiveFactor = 2/3;

    var myPlanets = universe.getPlanets(this);
    var planets = universe.getAllPlanets();

    var strategy = null;
    if (this.round < initialRounds) {
        if (playersLength > 3) {
            strategy = "conquerFirstCorner";
        } else {
            strategy = "spread";
        }

    } else {

        var myForces = universe.getForces(this);
        var otherForces = 0;

        universe.sortPlayersByForces(activePlayers, true);
        var maxForces = activePlayers[0];

        for (var i = 0; i <playersLength; ++i) {
            var other = activePlayers[i];
            if (other.equals(this)) continue;

            otherForces += universe.getForces(other);
        }

        if (finalFactor * myForces > otherForces && myPlanets.length > (planets.length / playersLength)) {
            strategy = "attackNearestEnemy";

        } else if (defensiveFactor * maxForces > myForces) {
            strategy = "albatross";

        } else {

            if (playersLength > 2) {
                strategy = "conquerClosestCorner";
            } else {
                strategy = "conquerRecruitingCenter";
            }

        }
    }

    this.strategies[strategy].think(universe);
};

var _constructor = SalamanderPlayer;