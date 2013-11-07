importScripts("battle_school/RatPlayer.js");

SalamanderPlayer: function SalamanderPlayer() {
    this.color = "DarkSeaGreen";
    this.initialize();
    this.setStrategies();
};
SalamanderPlayer.prototype = new Player();
SalamanderPlayer.prototype.constructor = SalamanderPlayer;

SalamanderConquerFirstCornerStrategy: function SalamanderConquerFirstCornerStrategy() {};
SalamanderConquerFirstCornerStrategy.prototype = new RatPlayerStrategy();
SalamanderConquerFirstCornerStrategy.prototype.constructor = SalamanderConquerFirstCornerStrategy;
SalamanderConquerFirstCornerStrategy.prototype.getClusterSize = function getClusterSize(universe) {
    var activePlayers = universe.getActivePlayers();
    if (activePlayers.length == 2) {
        return 6;
    } else {
        return 4;
    }
};

SalamanderConquerFirstCornerStrategy.prototype.think = function think(universe) {
    var myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;

    var minFleetSize = 10;
    var reserveFactor = 5;
    var cornerCoords = this.getClosestCorner(universe, myPlanets);

    for (var i = 0; i < myPlanets.length; ++i) {

        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < minFleetSize) continue;

        var targets = this.getHostileCluster(universe, myPlanet);

        if (targets.length == 0) return;
        this.sortByDistanceToCoords(targets, cornerCoords);

        for (var j = 0; j < targets.length && available > minFleetSize; j++) {
            var target = targets[j];
            if (this.inTopForceEnemyPlanets(universe, target, 5)) continue;
            var needed = this.getNeededForces(universe, target);

            if (needed > available) continue;
            var fleetSize = Math.max(needed, minFleetSize);
            this.player.sendFleet(myPlanet, target, fleetSize);
            available -= fleetSize;
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
    var reserveFactor = 10;
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


SalamanderPlayForTimeStrategy: function SalamanderPlayForTimeStrategy() {};
SalamanderPlayForTimeStrategy.prototype = new RatPlayerStrategy();
SalamanderPlayForTimeStrategy.prototype.constructor = SalamanderPlayForTimeStrategy;
SalamanderPlayForTimeStrategy.prototype.think = function think(universe) {
    var myPlanets = universe.getPlanets(this.player);
    var targets = universe.getEnemyPlanets(this.player);
    if (targets.length == 0 || myPlanets.length == 0) return;

    var minFleetSize = 5;

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var myForces = myPlanet.getForces();
        universe.sortByDistance(myPlanet, targets, true);
        if (myForces < minFleetSize) continue;
        var top = targets.slice(0, this.getClusterSize(universe));
        universe.sortByForces(top);
        this.player.sendFleet(myPlanet, targets[0], myForces);
    }
};

SalamanderPlayer.prototype.setStrategies = function setStrategies() {
    this.strategies =  {
        "conquerFirstCorner": new SalamanderConquerFirstCornerStrategy().setPlayer(this),
        "conquerClosestCorner": new SalamanderConquerClosestCornerStrategy().setPlayer(this),     // adapted from RatPlayerMiddleStrategy - always try to limit the front-line by attacking the closest corner
        "defensive": new SalamanderDefensiveStrategy().setPlayer(this),     // Albatross - able to draw or win instead of lose in some situations, esp. against SupportNetworkPlayer
        "playForTime": new SalamanderPlayForTimeStrategy().setPlayer(this), // abandon hope for a win and simply try to play for time in hope for a draw
        "finishingBlow": new RatPlayerFinalStrategy().setPlayer(this)       // AttackNearestEnemy - simple, but quick and effective for dealing the finishing blow
    };
};

SalamanderPlayer.prototype.think = function think(universe) {
    var myPlanets = universe.getPlanets(this);
    var allPlanets = universe.getAllPlanets();
    var activePlayers = universe.getActivePlayers();
    var finalFactor = 3/4;
    var defensiveFactor = 1/3;
    var abandonFactor = 1/4;

    var strategy = null;
    if ((myPlanets.length < Math.max(10, activePlayers.length)) && (myPlanets.length < allPlanets.length / activePlayers.length)) {
        strategy = "conquerFirstCorner";

    } else {

        var myForces = universe.getForces(this);
        var otherForces = 0;

        universe.sortPlayersByForces(activePlayers, true);
        var maxForces = activePlayers[0];

        for (var i = 0; i < activePlayers.length; ++i) {
            var other = activePlayers[i];
            if (other.equals(this)) continue;

            otherForces += universe.getForces(other);
        }

        if (finalFactor * myForces > otherForces) {
            strategy = "finishingBlow";

        } else if (abandonFactor * maxForces > myForces) {
            strategy = "playForTime";
            console.log("abandon ship");

        } else if (defensiveFactor * maxForces > myForces) {
            strategy = "defensive";

        } else {
            strategy = "conquerClosestCorner";
        }
    }

    this.strategies[strategy].think(universe);
};

var _constructor = SalamanderPlayer;