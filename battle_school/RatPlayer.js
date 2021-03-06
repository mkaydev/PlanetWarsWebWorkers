RatPlayer: function RatPlayer() {
    this.setStrategies();
};
RatPlayer.prototype = new Player();
RatPlayer.prototype.constructor = RatPlayer;

RatPlayerStrategy: function RatPlayerStrategy() {};
RatPlayerStrategy.prototype.getClusterSize = function getClusterSize() {
    return 5;
};
RatPlayerStrategy.prototype.think = function think(universe) {};
RatPlayerStrategy.prototype.setPlayer = function setPlayer(player) {
    this.player = player;
    return this;
};

RatPlayerStrategy.prototype.setupRound = function setupRound(universe) {
    this.universe = universe;
    this.inTopCache = {};
    this.topCache = [];
};

RatPlayerStrategy.prototype.getMaxStepsTo = function getMaxStepsTo(planet, planets) {
    var i, curMax, oPlanet, distance;
    curMax = 0;
    for (i = 0; oPlanet = planets[i]; ++i) {
        distance = planet.fleetStepsTo(oPlanet);
        if (distance > curMax) curMax = distance;
    }
    return curMax;
};

RatPlayerStrategy.prototype.getMinStepsTo = function getMinStepsTo(planet, planets) {
    var i, distance, curMin, oPlanet;

    curMin = Infinity;
    for (i = 0; oPlanet = planets[i]; ++i) {
        distance = planet.fleetStepsTo(oPlanet);
        if (distance < curMin) curMin = distance;
    }
    return curMin;
};

RatPlayerStrategy.prototype.getForcesToConquer = function getForcesToConquer(target, maxSteps) {
    var i,
        defendingForces,
        targetRecruiting,
        fleets,
        lastConqueror,
        fleet,
        curSteps,
        steps,
        fleetForces;

    defendingForces = target.getForces();
    targetRecruiting = target.getRecruitingPerStep();

    fleets = target.getTargetingFleets();
    this.universe.sortByDistanceToDestination(fleets);

    lastConqueror = target;

    curSteps = 0;
    for (i = 0; fleet = fleets[i]; ++i) {
        steps = fleet.stepsToDestination();
        if (steps > maxSteps) break;

        fleetForces = fleet.getForces();

        defendingForces += (steps - curSteps) * targetRecruiting;
        curSteps = steps;

        if (fleet.isHostileTo(lastConqueror)) {
            defendingForces -= fleetForces;

            if (defendingForces <= 0) {
                lastConqueror = fleet;
                defendingForces = Math.abs(defendingForces);
            }

        } else {
            defendingForces += fleetForces;
        }
    }

    if (lastConqueror.ownerEquals(this.player)) return -defendingForces;
    if (target.isNeutral()) return defendingForces;
    return defendingForces + maxSteps * targetRecruiting;
};

RatPlayerStrategy.prototype.getFriendlyCluster = function getFriendlyCluster(planet) {
    var clusterSize, planets;

    clusterSize = this.getClusterSize();
    planets = this.universe.getPlanets(this.player);
    this.universe.sortByDistance(planet, planets);

    if (planets.length < clusterSize) return planets;
    return planets.slice(0, clusterSize);
};

RatPlayerStrategy.prototype.getHostileCluster = function getHostileCluster(planet, noNeutral) {
    var clusterSize, planets;

    clusterSize = this.getClusterSize();
    planets = this.universe.getEnemyPlanets(this.player);
    this.universe.sortByDistance(planet, planets);

    if (noNeutral) planets = this.filterNeutral(planets);
    if (planets.length < clusterSize) return planets;
    return planets.slice(0, clusterSize);
};

RatPlayerStrategy.prototype.filterNeutral = function filterNeutral(planets) {
    var i, nonNeutral, planet;
    nonNeutral = [];
    for (i = 0; planet = planets[i]; ++i) {
        if (!planet.isNeutral()) nonNeutral.push(planet);
    }
    return nonNeutral;
};

RatPlayerStrategy.prototype.getNeededForces = function getNeededForces(planet) {
    var cluster, maxSteps, neededForces;
    cluster = this.getFriendlyCluster(planet);
    maxSteps = this.getMaxStepsTo(planet, cluster);
    neededForces = this.getForcesToConquer(planet, maxSteps);
    return neededForces;
};

RatPlayerStrategy.prototype.getTopForceEnemyPlanets = function getTopForceEnemyPlanets(count) {
    var i, planets, planet, nonNeutral;

    if (count > this.topCache.length) {
        planets = this.universe.getEnemyPlanets(this.player);
        nonNeutral = [];

        for (i = 0; planet = planets[i]; ++i) {
            if (!planet.isNeutral()) nonNeutral.push(planet);
        }

        this.universe.sortPlanetsByForces(nonNeutral, true);
        this.topCache = nonNeutral;
    }

    return this.topCache.slice(0, count);
};

RatPlayerStrategy.prototype.inTopForceEnemyPlanets = function inTopForceEnemyPlanets(planet, count) {
    var i, top, topPl, cache, planetId;

    if (!this.inTopCache.hasOwnProperty(count)) this.inTopCache[count] = {};
    cache = this.inTopCache[count];

    planetId = planet.getId();
    if(!cache.hasOwnProperty[planetId]) {
        top = this.getTopForceEnemyPlanets(count);

        cache[planetId] = false;
        for (i = 0; topPl = top[i]; ++i) {
            if (topPl.equals(planet)) cache[planetId] = true;
        }
    }
    return cache[planetId];
};

RatPlayerStrategy.prototype.getRecruitmentTarget = function getRecruitmentTarget() {
    var i, xSum, ySum, weightSum, planets, planet, weight;

    planets = this.universe.getEnemyPlanets(this.player);
    xSum = 0;
    ySum = 0;
    weightSum = 0;

    for (i = 0; planet = planets[i]; ++i) {
        weight = planet.getRecruitingPerStep();
        xSum += planet.getX() * weight;
        ySum += planet.getY() * weight;
        weightSum += weight;
    }
    return {"x": xSum / weightSum, "y": ySum / weightSum};
};

RatPlayerStrategy.prototype._sortByDistToCoords = function _sortByDistToCoords(a, b) {
    var distA, distB;
    distA = a.distanceToCoords(this.x, this.y);
    distB = b.distanceToCoords(this.x, this.y);
    return distA - distB;
};

RatPlayerStrategy.prototype.sortByDistanceToCoords = function sortByDistanceToCoords(planets, coords) {
    planets.sort(this._sortByDistToCoords.bind(coords));
};

RatPlayerStrategy.prototype.getClosestCorner = function getClosestCorner(planets) {
    var i,
        corners,
        closest,
        planet,
        minDist,
        minCorner,
        corner,
        coords,
        dist,
        maxCount,
        maxCorner,
        count;

    corners = {
        "uL": {"x": 0, "y": 0},
        "uR": {"x": this.universe.width, "y": 0},
        "bL": {"x": 0, "y": this.universe.height},
        "bR": {"x": this.universe.width, "y": this.universe.height}
    };
    closest = {"uL": 0, "uR": 0, "bL": 0, "bR": 0};

    for (i = 0; planet = planets[i]; ++i) {
        minDist = Infinity;

        for (corner in corners) {
            coords = corners[corner];
            dist = planet.distanceToCoords(coords.x, coords.y);
            if (dist < minDist) {
                minDist = dist;
                minCorner = corner;
            }
        }
        closest[minCorner] += 1;
    };

    maxCount = 0;
    for (corner in closest) {
        count = closest[corner];
        if (count > maxCount) {
            maxCount = count;
            maxCorner = corner;
        }
    }
    return corners[maxCorner];
};

RatPlayerInitialStrategy: function RatPlayerInitialStrategy() {};
RatPlayerInitialStrategy.prototype = new RatPlayerStrategy();
RatPlayerInitialStrategy.prototype.constructor = RatPlayerInitialStrategy;
RatPlayerInitialStrategy.prototype.getClusterSize = function getClusterSize() {
    var activePlayers = this.universe.getActivePlayers();
    if (activePlayers.length == 2) {
        return 5;
    } else {
        return 3;
    }
};

RatPlayerInitialStrategy.prototype.think = function think(universe) {
    var i,
        j,
        minReserveFactor,
        minFleetSize,
        activePlayers,
        myPlanets,
        cornerCoords,
        cornerTargets,
        myPlanet,
        myRecruiting,
        myForces,
        available,
        targets,
        target,
        minBreakEven,
        maxSteps,
        desiredFleetSize,
        fleetSize,
        destPlanet,
        playerCount;

    this.setupRound(universe);
    minReserveFactor = 5;
    minFleetSize = 20;

    activePlayers = universe.getActivePlayers();
    playerCount = activePlayers.length;
    myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;

    cornerCoords = this.getClosestCorner(myPlanets);
    cornerTargets = universe.getEnemyPlanets(this.player);
    if (cornerTargets.length == 0) return;
    this.sortByDistanceToCoords(cornerTargets, cornerCoords);

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        myRecruiting = myPlanet.getRecruitingPerStep();
        myForces = myPlanet.getForces();

        available = myForces - minReserveFactor * myRecruiting;
        if (available < minFleetSize) continue;

        targets = this.getHostileCluster(myPlanet);
        this.sortByDistanceToCoords(targets, cornerCoords);
        if (targets.length == 0) return;

        for (j = 0; target = targets[j]; ++j) {
            if (available < minFleetSize) break;

            if (this.inTopForceEnemyPlanets(target, playerCount)) continue;

            minBreakEven = Math.ceil(minFleetSize / target.getRecruitingPerStep());
            maxSteps = myPlanet.fleetStepsTo(target) + minBreakEven + 1;
            desiredFleetSize = this.getForcesToConquer(target, maxSteps);
            if (desiredFleetSize > available || desiredFleetSize < 0) continue;

            fleetSize = minFleetSize;
            if (desiredFleetSize > minFleetSize) fleetSize = desiredFleetSize;

            this.player.sendFleet(myPlanet, target, fleetSize);
            available -= fleetSize;
        }

        // try to conquer a corner as quickly as possible to have a safe back and avoid too many front-lines
        for (j = 0; destPlanet = cornerTargets[j]; ++j) {
            if (available < minFleetSize) break;

            fleetSize = this.getNeededForces(destPlanet);
            if (fleetSize <= 0) continue;

            fleetSize += minReserveFactor * destPlanet.getRecruitingPerStep();
            if (fleetSize > available) continue;

            this.player.sendFleet(myPlanet, destPlanet, fleetSize);
            available -= fleetSize;
        }
    }
};


RatPlayerMiddleStrategy: function RatPlayerMiddleStrategy() {};
RatPlayerMiddleStrategy.prototype = new RatPlayerStrategy();
RatPlayerMiddleStrategy.prototype.constructor = RatPlayerMiddleStrategy;
RatPlayerMiddleStrategy.prototype.getClusterSize = function getClusterSize() {
    var activePlayers = this.universe.getActivePlayers();
    if (activePlayers.length == 2) {
        return 3;
    } else {
        return Math.max(4, 8 - activePlayers.length);
    }
};

RatPlayerMiddleStrategy.prototype.getOrders = function getOrders(source, available, minFleetSizes, needsHelp, backupDirection) {
    var i,
        cluster,
        destinations,
        destination,
        destPlanet,
        neededForces,
        stepsTo,
        fleetSize,
        orders,
        order,
        x,
        y,
        closestInCluster;

    cluster = this.getFriendlyCluster(source);
    destinations = this.getTargets(source);
    destinations.push.apply(destinations, needsHelp);
    this.prioritize(source, available, destinations);

    orders = [];
    for (i = 0; destination = destinations[i]; ++i) {
        if (available < Math.min(minFleetSizes.defend, minFleetSizes.attack)) break;

        destPlanet = destination.planet;
        if (this.inTopForceEnemyPlanets(destPlanet, 5)) continue;

        neededForces = destination.neededForces;
        if (neededForces / this.getClusterSize() > available) continue;
        if (destPlanet.ownerEquals(this.player) && (neededForces < minFleetSizes.defend)) continue;

        stepsTo = source.fleetStepsTo(destPlanet);
        this.universe.sortByDistance(destPlanet, cluster);

        if (cluster.length > 0 && !destPlanet.isNeutral()) {
            closestInCluster = cluster[0];
            if (closestInCluster.fleetStepsTo(destPlanet) < stepsTo) {
                destPlanet = closestInCluster;
            }
        }

        fleetSize = Math.min(neededForces, available);
        order = {
            "destination": destPlanet,
            "fleetSize": fleetSize
        };

        orders.push(order);
        available -= fleetSize;
        destinations[i].neededForces -= fleetSize;
    }

    if (available > minFleetSizes.backup) {

        x = backupDirection.x;
        y = backupDirection.y;
        this.sortByDistanceToCoords(cluster, backupDirection);

        destPlanet = cluster[0];
        if (destPlanet.distanceToCoords(x, y) >= source.distanceToCoords(x, y)) destPlanet = source;

        if (!destPlanet.equals(source)) {
            order = {
                "destination": destPlanet,
                "fleetSize": available
            };
            orders.push(order);
        }
    }
    return orders;
};

RatPlayerMiddleStrategy.prototype.getTargets = function getTargets(source) {
    var i,
        enemyPlanets,
        targets,
        enemyPlanet,
        cluster,
        maxSteps,
        neededForces,
        target;

    enemyPlanets = this.getHostileCluster(source);
    targets = [];

    for (i = 0; enemyPlanet = enemyPlanets[i]; ++i) {
        cluster = this.getFriendlyCluster(enemyPlanet);
        maxSteps = this.getMaxStepsTo(enemyPlanet, cluster);
        neededForces = this.getForcesToConquer(enemyPlanet, maxSteps);
        
        if (neededForces > 0) {
            target = {
                "planet": enemyPlanet,
                "neededForces": neededForces
            };    
            targets.push(target);
        }
    }
    return targets;
};


RatPlayerMiddleStrategy.prototype.prioritize = function prioritize(source, available, destinations) {
    destinations.sort(this._prioritize.bind(source));
};

RatPlayerMiddleStrategy.prototype._prioritize = function _prioritize(a, b) {
    var distWeight,
        recruitingWeight,
        diffWeight,
        destA,
        destB,
        stepsToA,
        stepsToB,
        recruitingA,
        recruitingB,
        neededA,
        neededB,
        result;

    distWeight = 2;
    recruitingWeight = 3;
    diffWeight = 2;

    destA = a.planet;
    destB = b.planet;

    stepsToA = this.fleetStepsTo(destA);
    stepsToB = this.fleetStepsTo(destB);

    recruitingA = destA.getRecruitingPerStep();
    recruitingB = destB.getRecruitingPerStep();

    neededA = a.neededForces;
    neededB = b.neededForces;

    result = 1 - Math.pow(recruitingA / recruitingB, recruitingWeight) * Math.pow(stepsToB / stepsToA, distWeight) * Math.pow(neededA / neededB, diffWeight);
    return result;
};

RatPlayerMiddleStrategy.prototype.getReserveFactor = function getReserveFactor(planet) {
    return 10;
};

RatPlayerMiddleStrategy.prototype.getMinFleetSizes = function getMinFleetSizes() {
    return {
        "defend": 10,
        "attack": 20,
        "backup": 20
    };
};

RatPlayerMiddleStrategy.prototype.think = function think(universe) {
    var i,
        j,
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
        recruitmentTarget;

    this.setupRound(universe);
    minFleetSizes = this.getMinFleetSizes();

    myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length == 0) return;

    needsHelp = [];
    free = [];

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        neededForces = this.getNeededForces(myPlanet);

        if (neededForces > 0) {
            victim = {
                "planet": myPlanet,
                "neededForces": neededForces
            };
            needsHelp.push(victim);

        } else {

            available = myPlanet.getForces() - this.getReserveFactor(myPlanet) * myPlanet.getRecruitingPerStep();
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
    recruitmentTarget = this.getRecruitmentTarget();

    for (i = 0; backup = free[i]; ++i) {
        source = backup.planet;
        available = backup.available;

        orders = this.getOrders(source, available, minFleetSizes, needsHelp, recruitmentTarget);
        for (j = 0; order = orders[j]; ++j) {
            destination = order.destination;
            fleetSize = order.fleetSize;
            this.player.sendFleet(source, destination, fleetSize);
        }
    }
};


RatPlayerFinalStrategy: function RatPlayerFinalStrategy() {};
RatPlayerFinalStrategy.prototype = new RatPlayerStrategy();
RatPlayerFinalStrategy.prototype.constructor = RatPlayerFinalStrategy;
RatPlayerFinalStrategy.prototype.think = function think(universe) {
    var i,
        reserveFactor,
        minFleetSize,
        myPlanets,
        enemyPlanets,
        myPlanet,
        available,
        fleetSize,
        target;

    this.setupRound(universe);
    reserveFactor = 10;
    minFleetSize = 25;

    myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length == 0) return;

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < minFleetSize) continue;
        fleetSize = Math.max(Math.ceil(available / 2), minFleetSize);

        universe.sortByDistance(myPlanet, enemyPlanets);
        target = enemyPlanets[0];
        this.player.sendFleet(myPlanet, target, fleetSize);
    }
};


RatPlayer.prototype.setStrategies = function setStrategies() {
    this.strategies =  {
        "initial": new RatPlayerInitialStrategy().setPlayer(this),
        "middle": new RatPlayerMiddleStrategy().setPlayer(this),
        "final": new RatPlayerFinalStrategy().setPlayer(this)
    };
};

RatPlayer.prototype.think = function think(universe) {
    var i,
        myPlanets,
        allPlanets,
        activePlayers,
        finalFactor,
        myForces,
        otherForces,
        other;

    myPlanets = universe.getPlanets(this);
    allPlanets = universe.getAllPlanets();
    activePlayers = universe.getActivePlayers();
    finalFactor = 3/4;

    if ((myPlanets.length < Math.max(10, activePlayers.length)) && (myPlanets.length < allPlanets.length / activePlayers.length)) {
        this.strategies.initial.think(universe);

    } else {

        myForces = universe.getForces(this);
        otherForces = 0;

        for (i = 0; other = activePlayers[i]; ++i) {
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

var _constructor = RatPlayer;