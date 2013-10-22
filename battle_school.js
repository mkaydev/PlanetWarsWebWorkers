RatPlayerStrategy: function RatPlayerStrategy() {
    this.clusterSize = 5;
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
        if (distance < curMax) curMin = distance;
    }
    return curMin;
};

RatPlayerStrategy.prototype.getForcesToConquer = function getForcesToConquer(universe, target, maxSteps) {
    var defendingForces = target.getForces();

    var fleets = target.getTargetingFleets();
    universe.sortByDistanceToTarget(fleets);


    var lastConquerer = target;

    var curSteps = 0;
    for (var i = 0; i < fleets.length; i++) {
        var fleet = fleets[i];
        var steps = fleet.stepsToTarget();
        if (steps > maxSteps) break;

        defendingForces += (steps - curSteps) * target.getRecruitingPerStep();
        curSteps = steps;

        if (fleet.isHostileTo(lastConquerer)) {
            defendingForces -= fleet.getForces();

            if (defendingForces <= 0) {
                lastConquerer = fleet;
                defendingForces = Math.abs(defendingForces);
            }

        } else {
            defendingForces += fleet.getForces();
        }
    }

    if (lastConquerer.ownerEquals(this.player)) return -defendingForces;
    return defendingForces;
};

RatPlayerStrategy.prototype.getFriendlyCluster = function getFriendlyCluster(universe, planet) {
    var planets = universe.getPlanets(this.player);
    universe.sortByDistance(planet, planets);
    if (planets.length < this.clusterSize) return planets;
    return planets.slice(0, this.clusterSize);
};

RatPlayerStrategy.prototype.getHostileCluster = function getHostileCluster(universe, planet) {
    var planets = universe.getEnemyPlanets(this.player);
    universe.sortByDistance(planet, planets);
    if (planets.length < this.clusterSize) return planets;
    return planets.slice(0, this.clusterSize);
};

RatPlayerStrategy.prototype.getNeededForces = function getNeededForces(universe, planet, cluster) {
    var maxSteps = this.getMaxStepsTo(planet, cluster);
    var neededForces = this.getForcesToConquer(universe, planet, maxSteps);
    return neededForces;
};

RatPlayerInitialStrategy: function RatPlayerInitialStrategy() {
};
RatPlayerInitialStrategy.prototype = new RatPlayerStrategy();
RatPlayerInitialStrategy.prototype.constructor = RatPlayerInitialStrategy;

RatPlayerInitialStrategy.prototype.think = function think(universe) {
    var minReserveFactor = 5;
    var minFleetSize = 20;

    var myPlanets = universe.getPlanets(this.player);

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var maxAvailable = myPlanet.getForces() - minReserveFactor * myPlanet.getRecruitingPerStep();
        if (maxAvailable < minFleetSize) continue;

        var targets = this.getHostileCluster(universe, myPlanet);
        if (targets.length == 0) return;

        for (var j = 0; j < targets.length; j++) {
            var target = targets[j];
            var reserveFactor = myPlanet.fleetStepsTo(target);
            var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep()

            var minBreakEven = Math.ceil(minFleetSize / target.getRecruitingPerStep());
            var maxSteps = myPlanet.fleetStepsTo(target) + minBreakEven + 1;
            var desiredFleetSize = this.getForcesToConquer(universe, target, maxSteps);
            if (desiredFleetSize > available) continue;

            var fleetSize = minFleetSize;
            if (desiredFleetSize > minFleetSize) fleetSize = desiredFleetSize;

            this.player.sendFleet(myPlanet, target, fleetSize);
            available -= fleetSize;
            maxAvailable -= fleetSize;
            if (maxAvailable < minFleetSize) break;
        }
    }
};


RatPlayerMiddleStrategy: function RatPlayerMiddleStrategy() {
};
RatPlayerMiddleStrategy.prototype = new RatPlayerStrategy();
RatPlayerMiddleStrategy.prototype.constructor = RatPlayerMiddleStrategy;

RatPlayerMiddleStrategy.prototype.getOrders = function getOrders(universe, source, available, minFleetSize, needsHelp) {
    var cluster = this.getFriendlyCluster(source);
    var maxStepsTo = this.getMaxStepsTo(source, cluster);

    var targets = this.getTargets();

    var destinations = targets.concat(needsHelp);
    this.prioritize(source, available, destinations);

    var orders = [];
    for (var i = 0; i < destinations.length && available > minFleetSize; i++) {
        var destination = destinations[i];
        var destPlanet = destination.planet;
        var neededForces = destination.neededForces;

        var stepsTo = source.fleetStepsTo(destPlanet);
        universe.sortByDistance(destPlanet, cluster);

        if (cluster.length > 0) {
            var closestInCluster = cluster[0];
            if (closestInCluster.fleetStepsTo(dest) < stepsTo) {
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
    }
    return orders;
};

RatPlayerMiddleStrategy.prototype.getTargets = function getTargets(universe, source) {
    var enemyPlanets = this.getHostileCluster(source);
    var targets = [];
    for (var i = 0; i < enemyPlanets.length; i++) {
        var enemyPlanet = enemyPlanets[i];
        var cluster = this.getFriendlyCluster(enemyPlanet);
        var maxSteps = this.getMinStepsTo(enemyPlanet, cluster);
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
    var prioritize = function prioritize(a, b) {
        var distWeight = 2;
        var recruitingWeight = 3;

        var destA = a.planet;
        var destB = b.planet;

        var stepsToA = backup.fleetStepsTo(destA);
        var stepsToB = backup.fleetStepsTo(destB);

        var recruitingA = destA.getRecruitingPerStep();
        var recruitingB = destB.getRecruitingPerStep();

        var neededA = a.neededForces;
        var neededB = b.neededForces;

        return (Math.pow(stepsToB, distWeight) * neededB) / (Math.pow(recruitingB, recruitingWeight) * available) -
                (Math.pow(stepsToA, distWeight) * neededA) / (Math.pow(recruitingA, recruitingWeight) * available);
    };

    destinations.sort(prioritize);
};

RatPlayerMiddleStrategy.prototype.think = function think(universe) {
    var minFleetSize = 5;

    var myPlanets = universe.getPlanets(this.player);
    var enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length === 0) return;

    var needsHelp = [];
    var free = [];

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var cluster = this.getFriendlyCluster(myPlanet);
        var neededForces = this.getNeededForces(universe, myPlanet, cluster);
        if (neededForces > 0) {
            var victim = {
                "planet": myPlanet,
                "neededForces": neededForces
            };
            needsHelp.push(victim);
        } else if (neededForces < -minFleetSize) {

            var backup = {
                "planet": myPlanet,
                "available": -neededForces
            };
            free.push(myPlanet);
        }
    }

    for (var i = 0; i < free.length; i++) {
        var backup = free[i];
        var source = backup.planet;
        var available = backup.available;

        var orders = this.getOrders(universe, source, available, minFleetSize, needsHelp);
        for (var j = 0; j < orders.length; j++) {
            var order = orders[j];
            var destination = order.destination;
            var fleetSize = order.fleetSize;
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
    
    if (myPlanets.length < 10) {
        this.strategies.initial.think(universe);
    } else {

        var activePlayers = universe.getActivePlayers();
        var myForces;
        var otherForces = 0;

        for (var i = 0; i < activePlayers.length; i++) {
            var player = activePlayers[i];
            var forces = universe.getForces();

            if (player === this) {
                myForces = forces;
            } else {
                otherForces += forces;
                if ((typeof myForces !== "undefined") && (otherForces > myForces)) {
                    this.strategies.middle.think(universe);
                    return;
                }
            }

        }

        if (otherForces > myForces) {
            this.strategies.middle.think(universe);
        } else {
            this.strategies.final.think(universe);
        }

    }
};