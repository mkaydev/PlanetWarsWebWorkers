RatPlayerStrategy: function RatPlayerStrategy() {
};
RatPlayerStrategy.prototype.getClusterSize = function getClusterSize(universe) {
    return 5;
};
RatPlayerStrategy.prototype.think = function think(universe) {};
RatPlayerStrategy.prototype.setPlayer = function setPlayer(player) {
    this.player = player;
    return this;
};

RatPlayerStrategy.prototype.getMaxStepsTo = function getMaxStepsTo(planet, planets) {
    var curMax = 0;
    for (var i = 0; i < planets.length; i++) {
        var distance = planet.fleetStepsTo(planets[i]);
        if (distance > curMax) curMax = distance;
    }
    return curMax;
};

RatPlayerStrategy.prototype.getMinStepsTo = function getMinStepsTo(planet, planets) {
    var curMin = Infinity;
    for (var i = 0; i < planets.length; i++) {
        var distance = planet.fleetStepsTo(planets[i]);
        if (distance < curMin) curMin = distance;
    }
    return curMin;
};

RatPlayerStrategy.prototype.getForcesToConquer = function getForcesToConquer(universe, target, maxSteps) {
    var defendingForces = target.getForces();

    var fleets = target.getTargetingFleets();
    universe.sortByDistanceToDestination(fleets);

    var lastConqueror = target;

    var curSteps = 0;
    for (var i = 0; i < fleets.length; i++) {
        var fleet = fleets[i];
        var steps = fleet.stepsToDestination();
        if (steps > maxSteps) break;

        defendingForces += (steps - curSteps) * target.getRecruitingPerStep();
        curSteps = steps;

        if (fleet.isHostileTo(lastConqueror)) {
            defendingForces -= fleet.getForces();

            if (defendingForces <= 0) {
                lastConqueror = fleet;
                defendingForces = Math.abs(defendingForces);
            }

        } else {
            defendingForces += fleet.getForces();
        }
    }
    if (lastConqueror.ownerEquals(this.player)) return -defendingForces;
    if (target.isNeutral()) return defendingForces;
    return defendingForces + maxSteps * target.getRecruitingPerStep();
};

RatPlayerStrategy.prototype.getFriendlyCluster = function getFriendlyCluster(universe, planet) {
    var planets = universe.getPlanets(this.player);
    universe.sortByDistance(planet, planets);
    if (planets.length < this.getClusterSize(universe)) return planets;
    return planets.slice(0, this.getClusterSize(universe));
};

RatPlayerStrategy.prototype.getHostileCluster = function getHostileCluster(universe, planet) {
    var planets = universe.getEnemyPlanets(this.player);
    universe.sortByDistance(planet, planets);
    if (planets.length < this.getClusterSize(universe)) return planets;
    return planets.slice(0, this.getClusterSize(universe));
};

RatPlayerStrategy.prototype.getNeededForces = function getNeededForces(universe, planet) {
    var cluster = this.getFriendlyCluster(universe, planet);
    var maxSteps = this.getMaxStepsTo(planet, cluster);
    var neededForces = this.getForcesToConquer(universe, planet, maxSteps);
    return neededForces;
};

RatPlayerStrategy.prototype.getTopForceEnemyPlanets = function getTopForceEnemyPlanets(universe, count) {
    var sortByForces = function(a, b) {
        return b.getForces() - a.getForces();
    };
    var planets = universe.getEnemyPlanets(this.player);
    
    var nonNeutral = [];
    for (var i = 0; i < planets.length; i++) {
        var planet = planets[i];
        if (!planet.isNeutral()) nonNeutral.push(planet);
    }

    nonNeutral.sort(sortByForces);
    return nonNeutral.slice(0, count);
};

RatPlayerStrategy.prototype.inTopForceEnemyPlanets = function inTopForceEnemyPlanets(universe, planet, count) {
    var top = this.getTopForceEnemyPlanets(universe, count);
    for (var i = 0; i < top.length; i++) {
        if (top[i] === planet) return true;
    }
    return false;
};

RatPlayerStrategy.prototype.getRecruitmentTarget = function getRecruitmentTarget(universe) {
    var planets = universe.getEnemyPlanets(this.player);

    var xSum = 0;
    var ySum = 0;
    var weightSum = 0;

    for (var i = 0; i < planets.length; i++) {
        var planet = planets[i];
        var weight = planet.getRecruitingPerStep();
        xSum += planet.getX() * weight;
        ySum += planet.getY() * weight;
        weightSum += weight;
    }
    return {"x": xSum / weightSum, "y": ySum / weightSum};
};

RatPlayerStrategy.prototype.sortByDistanceToCoords = function sortByDistanceToCoords(planets, x, y) {
    var sortByDist = function sortByDist(a, b) {
        var distA = a.distanceToCoords(x, y);
        var distB = b.distanceToCoords(x, y);
        return distA - distB;
    };
    planets.sort(sortByDist);
};

RatPlayerStrategy.prototype.getClosestCorner = function getClosestCorner(universe, planets) {
    var corners = {
        "uL": {"x": 0, "y": 0},
        "uR": {"x": universe.getWidth(), "y": 0},
        "bL": {"x": 0, "y": universe.getHeight()},
        "bR": {"x": universe.getWidth(), "y": universe.getHeight()}
    };
    var closest = {"uL": 0, "uR": 0, "bL": 0, "bR": 0};

    for (var i = 0; i < planets.length; i++) {
        var planet = planets[i];
        var minDist = Infinity;
        var minCorner;

        for (var corner in corners) {
            var coords = corners[corner];
            var dist = planet.distanceToCoords(coords.x, coords.y);
            if (dist < minDist) {
                minDist = dist;
                minCorner = corner;
            }
        }

        closest[minCorner] += 1;
    };

    var maxCount = 0;
    var maxCorner;
    for (var corner in closest) {
        var count = closest[corner];
        if (count > maxCount) {
            maxCount = count;
            maxCorner = corner;
        }
    }
    if (typeof corners[maxCorner] === "undefined") {
        simulator.log(closest);
        simulator.log(corners);
        simulator.log(maxCorner);
    }
    return corners[maxCorner];
};

RatPlayerInitialStrategy: function RatPlayerInitialStrategy() {
};
RatPlayerInitialStrategy.prototype = new RatPlayerStrategy();
RatPlayerInitialStrategy.prototype.constructor = RatPlayerInitialStrategy;
RatPlayerInitialStrategy.prototype.getClusterSize = function getClusterSize(universe) {
    var activePlayers = universe.getActivePlayers();
    if (activePlayers.length == 2) {
        return 5;
    } else {
        return 3;
    }
};

RatPlayerInitialStrategy.prototype.think = function think(universe) {
    var minReserveFactor = 5;
    var minFleetSize = 20;

    var activePlayers = universe.getActivePlayers();
    var myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;
    var cornerCoords = this.getClosestCorner(universe, myPlanets);
    var cornerTargets = universe.getAllPlanets();
    this.sortByDistanceToCoords(cornerTargets, cornerCoords.x, cornerCoords.y);

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var maxAvailable = myPlanet.getForces() - minReserveFactor * myPlanet.getRecruitingPerStep();
        if (maxAvailable < minFleetSize) continue;

        var targets = this.getHostileCluster(universe, myPlanet);
        this.sortByDistanceToCoords(targets, cornerCoords);
        if (targets.length == 0) return;

        for (var j = 0; j < targets.length; j++) {
            var target = targets[j];
            if (this.inTopForceEnemyPlanets(universe, target, activePlayers.length)) continue;
            var reserveFactor = myPlanet.fleetStepsTo(target);
            var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep()

            var minBreakEven = Math.ceil(minFleetSize / target.getRecruitingPerStep());
            var maxSteps = myPlanet.fleetStepsTo(target) + minBreakEven + 1;
            var desiredFleetSize = this.getForcesToConquer(universe, target, maxSteps);
            if (desiredFleetSize > available || desiredFleetSize < 0) continue;

            var fleetSize = minFleetSize;
            if (desiredFleetSize > minFleetSize) fleetSize = desiredFleetSize;

            this.player.sendFleet(myPlanet, target, fleetSize);
            available -= fleetSize;
            maxAvailable -= fleetSize;
            if (maxAvailable < minFleetSize) break;
        }

        // try to conquer a corner as quickly as possible to have a safe back and avoid too many front-lines
        while (available > minFleetSize) {
            for (var i = 0; i < cornerTargets.length; i++) {
                var destPlanet = cornerTargets[i];
                if (!destPlanet.ownerEquals(this.player)) {
                    var fleetSize = this.getNeededForces(universe, destPlanet);
                    fleetSize += reserveFactor * destPlanet.getRecruitingPerStep();
                    if (fleetSize > available) continue;
                    this.player.sendFleet(myPlanet, destPlanet, fleetSize);
                    available -= fleetSize;
                }
            }
        }
    }
};


RatPlayerMiddleStrategy: function RatPlayerMiddleStrategy() {
};
RatPlayerMiddleStrategy.prototype = new RatPlayerStrategy();
RatPlayerMiddleStrategy.prototype.constructor = RatPlayerMiddleStrategy;
RatPlayerMiddleStrategy.prototype.getClusterSize = function getClusterSize(universe) {
    var activePlayers = universe.getActivePlayers();
    if (activePlayers.length == 2) {
        return 3;
    } else {
        return Math.max(3, 7 - activePlayers.length);
    }
};

RatPlayerMiddleStrategy.prototype.getOrders = function getOrders(universe, source, available, minFleetSizes, needsHelp) {
    var cluster = this.getFriendlyCluster(universe, source);
    var destinations = this.getTargets(universe, source);
    destinations.push.apply(destinations, needsHelp);
    this.prioritize(source, available, destinations);

    var orders = [];
    for (var i = 0; i < destinations.length && available > Math.min(minFleetSizes.defend, minFleetSizes.attack); i++) {
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
        //simulator.log("fleetSize " + order.fleetSize + " available " + available + " needed " + neededForces);
        available -= fleetSize;
        destinations[i].neededForces -= fleetSize;
    }

    if (available > minFleetSizes.backup) {
        var recruitingCenter = this.getRecruitmentTarget(universe);
        var x = recruitingCenter.x;
        var y = recruitingCenter.y;
        this.sortByDistanceToCoords(cluster, x, y);
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

RatPlayerMiddleStrategy.prototype.getTargets = function getTargets(universe, source) {
    var enemyPlanets = this.getHostileCluster(universe, source);
    var targets = [];
    for (var i = 0; i < enemyPlanets.length; i++) {
        var enemyPlanet = enemyPlanets[i];
        var cluster = this.getFriendlyCluster(universe, enemyPlanet);
        var maxSteps = this.getMaxStepsTo(enemyPlanet, cluster);
        var neededForces = this.getForcesToConquer(universe, enemyPlanet, maxSteps);
        
        if (neededForces > 0) {
            var target = {
                "planet": enemyPlanet,
                "neededForces": neededForces
            };    
            targets.push(target);
        }
    }
    return targets;
};


RatPlayerMiddleStrategy.prototype.prioritize = function prioritize(source, available, destinations) {
  //  var log = [];

    var prioritize = function prioritize(a, b) {
        var distWeight = 2;
        var recruitingWeight = 3;
        var diffWeight = 2;

        var destA = a.planet;
        var destB = b.planet;

        var stepsToA = source.fleetStepsTo(destA);
        var stepsToB = source.fleetStepsTo(destB);

        var recruitingA = destA.getRecruitingPerStep();
        var recruitingB = destB.getRecruitingPerStep();

        var neededA = a.neededForces;
        var neededB = b.neededForces;

        var result = 1 - Math.pow(recruitingA / recruitingB, recruitingWeight) * Math.pow(stepsToB / stepsToA, distWeight) * Math.pow(neededA / neededB, diffWeight);

       // log.push([stepsToA, stepsToB, recruitingA, recruitingB, neededA, neededB, result]);

        return result;
    };
    destinations.sort(prioritize);
   // simulator.log(log);
};

RatPlayerMiddleStrategy.prototype.think = function think(universe) {
    var minFleetSizes = {
        "defend": 10,
        "attack": 20,
        "backup": 20
    };
    var reserveFactor = 10;

    var myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;
    var enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length === 0) return;

    var needsHelp = [];
    var free = [];

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var neededForces = this.getNeededForces(universe, myPlanet);
        if (neededForces > 0) {
            var victim = {
                "planet": myPlanet,
                "neededForces": neededForces
            };
            needsHelp.push(victim);
        } else {
            var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
            if (available > Math.min(minFleetSizes.defend, minFleetSizes.attack)) {
                var backup = {
                    "planet": myPlanet,
                    "available": myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep()
                };
                free.push(backup);
            }
        }
    }

    for (var i = 0; i < free.length; i++) {
        var backup = free[i];
        var source = backup.planet;
        var available = backup.available;

        var orders = this.getOrders(universe, source, available, minFleetSizes, needsHelp);
        for (var j = 0; j < orders.length; j++) {
            var order = orders[j];
            var destination = order.destination;
            var fleetSize = order.fleetSize;
            //simulator.log("i:" + i + " j:" + j + " fleetSize: " + fleetSize + " factAvail:" + source.getForces() + " thoughtAvail:" + available);
            this.player.sendFleet(source, destination, fleetSize);
        }
    }
};

RatPlayerFinalStrategy: function RatPlayerFinalStrategy() {
};
RatPlayerFinalStrategy.prototype = new RatPlayerStrategy();
RatPlayerFinalStrategy.prototype.constructor = RatPlayerFinalStrategy;
RatPlayerFinalStrategy.prototype.think = function think(universe) {
    var reserveFactor = 10;
    var minFleetSize = 25;

    var myPlanets = universe.getPlanets(this.player);
    var enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length === 0) return;

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < minFleetSize) continue;
        var fleetSize = Math.max(Math.ceil(available / 2), minFleetSize);
        universe.sortByDistance(myPlanet, enemyPlanets);
        var target = enemyPlanets[0];
        this.player.sendFleet(myPlanet, target, fleetSize);
    }
};


RatPlayer: function RatPlayer() {
    this.color = "LightSteelBlue";
    this.initialize();
    this.setStrategies();
};
RatPlayer.prototype = new Player();
RatPlayer.prototype.constructor = RatPlayer;
RatPlayer.prototype.setStrategies = function setStrategies() {
    this.strategies =  {
        "initial": new RatPlayerInitialStrategy().setPlayer(this),
        "middle": new RatPlayerMiddleStrategy().setPlayer(this),
        "final": new RatPlayerFinalStrategy().setPlayer(this)
    };
};

RatPlayer.prototype.think = function think(universe) {
    var myPlanets = universe.getPlanets(this);
    var allPlanets = universe.getAllPlanets();
    var activePlayers = universe.getActivePlayers();
    var finalFactor = 3/4;

    if ((myPlanets.length < Math.max(10, activePlayers.length)) && (myPlanets.length < allPlanets.length / activePlayers.length)) {
        this.strategies.initial.think(universe);
    } else {
        var myForces = universe.getForces(this);
        var otherForces = 0;
        for (var i = 0; i < activePlayers.length; i++) {
            var other = activePlayers[i];
            if (other.equals(this)) continue;
            otherForces += universe.getForces(other);
        }
        if (finalFactor * myForces > otherForces) {
            this.strategies.final.think(universe);
        } else {
            this.strategies.middle.think(universe);
        }
    }
};