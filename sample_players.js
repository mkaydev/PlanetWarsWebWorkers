/*
    to implement a player, set the prototype of the new player object to new Player() and the constructor to the new player constructor
    there are two things you have to do in the player's constructor:
        1. set this.color to a color of your choice
        2. call this.initialize()
    afterwards implement the .think function, which takes the current universe

    publicly accessible functions for use in the .think method:

    Player:sendFleet(source, destination, fleetSize)
        source: a planet, owned by the player
        destination: a planet
        fleetSize: an integer
    Player:equals

    Planet:getRecruitingPerStep()
    Planet:isNeutral()
    Planet:getForces()
    Planet:distanceTo(otherPlanet)
    Planet:distanceToCoords(x, y)
    Planet:fleetStepsTo(otherPlanet)
    Planet:ownerEquals(player)
    Planet:getX()
    Planet:getY()

    Fleet:ownerEquals(player)
    Fleet:distanceToDestination()
    Fleet:stepsToDestination()
    Fleet:isHostileTo(fleetOrPlanet)
    Fleet:isHostileToDestination()
    Fleet:getMovementPerStep()
    Fleet:getForces()
    Fleet:getX()
    Fleet:getY()
    Fleet:getDestination()
    Fleet:getSource()

    Universe:getActivePlayers()

    Universe:getAllPlanets()
    Universe:getPlanets(player)
    Universe:getNeutralPlanets()
    Universe:getEnemyPlanets(player)
    Universe:sortByDistance(planet, planets)
    Universe:sortByRecruitingPower(planets)

    Universe:getGroundForces(player)
    Universe:getAirForces(player)
    Universe:getForces(player)

    Universe:getAllFleets()
    Universe:getFleets(player)
    Universe:getEnemyFleets(player)
    Universe:sortByDistanceToDestination(fleets)

 for debugging:
    simulator.log(message) allows logging to the console (only string or json objects)
    simulator.alert(message) allows creating alert windows (only string or json objects)

    if your player manages to freeze your browser, because the .think method takes too long and you're not able to debug the method because of it,
    try setting the statesPerMessage value of the simulator to a lower value (the simulator tries to precalculate twice this number of states)

    be aware that this logging function relies on the asynchronous message passing of the web worker and therefore won't be in order,
    a messageId (count of logs/alerts sent) is being sent together with the message being kept track of by the simulator

 */


RandomPlayer: function RandomPlayer() {
    this.color = "red";
    this.initialize();
};
RandomPlayer.prototype = new Player();
RandomPlayer.prototype.constructor = RandomPlayer;
RandomPlayer.prototype.think = function think(universe) {
    var fleetSize = 25;

    var myPlanets = universe.getPlanets(this);
    var allPlanets = universe.getAllPlanets();

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        if (myPlanet.getForces() > fleetSize) {
            var targetIndex = Math.floor(Math.random() * allPlanets.length)
            this.sendFleet(myPlanet, allPlanets[targetIndex], fleetSize);
        }
    }
}

AttackRandomPlayer: function AttackRandomPlayer() {
    this.color = "blue";
    this.initialize();
};
AttackRandomPlayer.prototype = new Player();
AttackRandomPlayer.prototype.constructor = AttackRandomPlayer;

AttackRandomPlayer.prototype.think = function think(universe) {
    var fleetSize = 25;

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length === 0) return;


    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        if (myPlanet.getForces() > fleetSize) {
            var targetIndex = Math.floor(Math.random() * enemyPlanets.length)
            this.sendFleet(myPlanet, enemyPlanets[targetIndex], fleetSize);
        }
    }
};

DoNothingPlayer: function DoNothingPlayer() {
    this.color = "yellow";
    this.initialize();
};
DoNothingPlayer.prototype = new Player();
DoNothingPlayer.prototype.constructor = DoNothingPlayer;


AttackLargestEmpirePlayer: function AttackLargestEmpirePlayer() {
    this.color = "green";
    this.initialize();
};
AttackLargestEmpirePlayer.prototype = new Player();
AttackLargestEmpirePlayer.prototype.constructor = AttackLargestEmpirePlayer;

AttackLargestEmpirePlayer.prototype.think = function think(universe) {
    var fleetSize = 25;

    var curMax = 0;
    var curTargets = [];
    var activePlayers = universe.getActivePlayers();

    for (var i = 0; i < activePlayers.length; i++) {
        if (activePlayers[i] === this) continue;
        var planets = universe.getPlanets(activePlayers[i]);
        if (planets.length > curMax) {
            curMax = planets.length;
            curTargets = planets;
        }
    }

    if (curTargets.length == 0) return;

    var myPlanets = universe.getPlanets(this);

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        if (myPlanet.getForces() > fleetSize) {
            var targetIndex = Math.floor(Math.random() * curTargets.length);
            this.sendFleet(myPlanet, curTargets[targetIndex], fleetSize);
        }
    }
};

KamikazePlayer: function KamikazePlayer() {
    this.color = "salmon";
    this.initialize();
};
KamikazePlayer.prototype = new Player();
KamikazePlayer.prototype.constructor = KamikazePlayer;
KamikazePlayer.prototype.think = function think(universe) {
    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length === 0) return;

    var curMax = 0;
    for (var i = 0; i < enemyPlanets.length; i++) {
        var enemyPlanet = enemyPlanets[i];
        if (enemyPlanet.getRecruitingPerStep() > curMax) {
            curMax = enemyPlanet.getRecruitingPerStep();
        }
    }

    var targets = [];
    for (var i = 0; i < enemyPlanets.length; i++) {
        var enemyPlanet = enemyPlanets[i];
        if (enemyPlanet.getRecruitingPerStep() === curMax) {
            targets.push(enemyPlanet);
        }
    }
    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        shuffleArray(targets);
        for (var j = 0; j < targets.length; j++) {
            var curTarget = targets[j];
            if (myPlanet.getForces() > curTarget.getForces()) this.sendFleet(myPlanet, curTarget, myPlanet.getForces());
        }
    }
};

AttackBestPlanetPlayer: function AttackBestPlanetPlayer() {
    this.color = "AntiqueWhite";
    this.initialize();
};
AttackBestPlanetPlayer.prototype = new Player();
AttackBestPlanetPlayer.prototype.constructor = AttackBestPlanetPlayer;
AttackBestPlanetPlayer.prototype.think = function think(universe) {
    var reserveFactor = 10;

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length === 0) return;

    var curMax = 0;
    for (var i = 0; i < enemyPlanets.length; i++) {
        var enemyPlanet = enemyPlanets[i];
        if (enemyPlanet.getRecruitingPerStep() > curMax) {
            curMax = enemyPlanet.getRecruitingPerStep();
        }
    }

    var targets = [];
    for (var i = 0; i < enemyPlanets.length; i++) {
        var enemyPlanet = enemyPlanets[i];
        if (enemyPlanet.getRecruitingPerStep() === curMax) {
            targets.push(enemyPlanet);
        }
    }
    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        shuffleArray(targets);
        for (var j = 0; j < targets.length; j++) {
            var curTarget = targets[j];
            var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
            if (available > curTarget.getForces()) this.sendFleet(myPlanet, curTarget, myPlanet.getForces());
        }
    }
};

AttackNearestEnemyPlayer: function AttackNearestEnemyPlayer() {
    this.color = "orange";
    this.initialize();
};
AttackNearestEnemyPlayer.prototype = new Player();
AttackNearestEnemyPlayer.prototype.constructor = AttackNearestEnemyPlayer;

AttackNearestEnemyPlayer.prototype.think = function think(universe) {
    var reserveFactor = 10;
    var fleetSize = 25;

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length === 0) return;

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        var target = enemyPlanets[0];
        this.sendFleet(myPlanet, target, fleetSize);
    }
};

SupportNetworkPlayer: function SupportNetworkPlayer() {
    this.color = "aqua";
    this.initialize();
};
SupportNetworkPlayer.prototype = new Player();
SupportNetworkPlayer.prototype.constructor = SupportNetworkPlayer;

SupportNetworkPlayer.prototype.think = function think(universe) {
    var reserveFactor = 10;
    var fleetSize = 30;
    var support = 2.5;

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length === 0) return;

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        var target = enemyPlanets[0];
        var destination = this.getNextDestination(universe, myPlanet, target, support);

        this.sendFleet(myPlanet, destination, fleetSize);
    }
};

SupportNetworkPlayer.prototype.getLastHop = function getLastHop(universe, source, target, support) {
    if (typeof target === "undefined") {
        return;
    }
    var minDist = Math.pow(source.distanceTo(target), support);
    var destination = target;

    var myPlanets = universe.getPlanets(this);

    for (var i = 0; i < myPlanets.length; i++) {
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

SupportNetworkPlayer.prototype.getNextDestination = function getNextDestination(universe, source, target, support) {
    if (typeof target === "undefined") return;
    var lastHop = this.getLastHop(universe, source, target, support);
    var hopBeforeLast = this.getLastHop(universe, source, lastHop, support);

    while (hopBeforeLast !== lastHop) {
        lastHop = hopBeforeLast;
        hopBeforeLast = this.getLastHop(universe, source, lastHop, support);
    }
    return lastHop;
};

AlbatrossPlayer: function AlbatrossPlayer() {
    this.color = "purple";
    this.initialize();
};
AlbatrossPlayer.prototype = new SupportNetworkPlayer();
AlbatrossPlayer.prototype.constructor = AlbatrossPlayer;
AlbatrossPlayer.prototype.think = function think(universe) {
    var fleetSize = 25;
    var reserveFactor = 10;
    var support = 3;

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length === 0) return;


    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        var target = enemyPlanets[0];
        var destination = this.getNextDestination(universe, myPlanet, target, support);

        if (target === destination) {
            if (target.getForces() > available && target.getRecruitingPerStep() >= myPlanet.getRecruitingPerStep()) continue;
        }

        var fleetSize = Math.ceil(target.getForces() / fleetSize) * fleetSize;
        this.sendFleet(myPlanet, destination, Math.min(available, fleetSize));
    }
};

VirusPlayer: function VirusPlayer() {
    this.color = "Olive";
    this.initialize();
};
VirusPlayer.prototype = new Player();
VirusPlayer.prototype.constructor = VirusPlayer;
VirusPlayer.prototype.think = function think(universe) {
    var fleetSize = 25;
    var reserveFactor = 10;
    var fullOutFactor = 3;

    this.evaluateVictim = function evaluateVictim(target, attacker) {
        var defendingForces = target.getForces();
        var defendingFleets = target.getDefendingFleets();
        for (var i = 0; i < defendingFleets.length; i++) {
            defendingForces += defendingFleets[i].getForces();
        }

        var attackingFleets = target.getAttackingFleets();
        for (var i = 0; i < attackingFleets.length; i++) {
            defendingForces -= attackingFleets[i].getForces();
        }
        var evaluation = {
            "attack": defendingForces < fleetSize || attacker.getForces() > fullOutFactor * defendingForces,
            "fullOut": attacker.getForces() > fullOutFactor * defendingForces
        };

        return evaluation;
    }.bind(this);

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);

        var foundVictim = false;

        for (var j = 0; j < enemyPlanets.length; j++ ) {
            var target = enemyPlanets[j];
            var evaluation = this.evaluateVictim(target, myPlanet);
            if (evaluation.attack) {
                if (evaluation.fullOut) {
                    var attackSize =  Math.max(Math.floor(available / fullOutFactor), fleetSize);
                    this.sendFleet(myPlanet, target, attackSize);
                    available -= attackSize;
                } else {
                    this.sendFleet(myPlanet, target, fleetSize);
                    available -= fleetSize;
                }
                foundVictim = true;
            }
            if (available < fleetSize) break;
        }

        if (available > fleetSize && !foundVictim) {
            var destination = this.getPlanetWithMaxForce(myPlanets);
            if (myPlanet !== destination) this.sendFleet(myPlanet, destination, Math.max(Math.floor(available / fullOutFactor), fleetSize));
        };
    }
};

VirusPlayer.prototype.getPlanetWithMaxForce = function getPlanetWithMaxForce(planets) {
    var curMax = 0;
    var curPlanet;

    for (var i = 0; i < planets.length; i++) {
        var planet = planets[i];
        var forces = planet.getForces();
        if (forces > curMax) {
            curMax = forces;
            curPlanet = planet;
        }
    }
    return curPlanet;
};

SpiralPlayer: function SpiralPlayer() {
    this.color = "Chocolate";
    this.initialize();

    this.destinations = {};
};
SpiralPlayer.prototype = new Player();
SpiralPlayer.prototype.constructor = SpiralPlayer;

SpiralPlayer.prototype.think = function think(universe) {
    var reserveFactor = 10;
    var minFleetSize = 25;

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length === 0) return;

    universe.sortByRecruitingPower(myPlanets);
    var centralPlanet = myPlanets[0];
    if (typeof centralPlanet === "undefined") return;

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < minFleetSize) continue;
        var fleetSize = Math.max(minFleetSize, Math.floor(available / 2));

        this.sortByDistance(centralPlanet, myPlanet, enemyPlanets);

        var planetKey = myPlanet.getX() + " " + myPlanet.getY();
        if (!this.destinations.hasOwnProperty(planetKey)) {
            var destination = enemyPlanets[0];
            this.destinations[planetKey] = destination;
            this.sendFleet(myPlanet, destination, fleetSize);
        } else {
            var destination = this.destinations[planetKey];
            this.sendFleet(myPlanet, destination, fleetSize);
        }
    }
};

SpiralPlayer.prototype.sortByDistance = function sortByDistance(central, planet, planets) {
    var sortByDist = function sortByDist(a, b) {
        var distA = planet.distanceTo(a) + central.distanceTo(a);
        var distB = planet.distanceTo(b) + central.distanceTo(b);
        return distA - distB;
    };
    planets.sort(sortByDist);
};
