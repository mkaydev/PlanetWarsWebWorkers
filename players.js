RandomPlayer: function RandomPlayer() {
    this.color = "red";
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
};
DoNothingPlayer.prototype = new Player();
DoNothingPlayer.prototype.constructor = DoNothingPlayer;


AttackLargestEmpirePlayer: function AttackLargestEmpirePlayer() {
    this.color = "green";
}
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
}
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
    this.color = "AntiqueWhite ";
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

        var target = universe.getNearest(myPlanet, enemyPlanets);
        this.sendFleet(myPlanet, target, fleetSize);
    }
};

SupportNetworkPlayer: function SupportNetworkPlayer() {
    this.color = "aqua";
}
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

        var target = universe.getNearest(myPlanet, enemyPlanets);
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

        var target = universe.getNearest(myPlanet, enemyPlanets);
        var destination = this.getNextDestination(universe, myPlanet, target, support);

        if (target === destination) {
            if (target.getForces() > available && target.getRecruitingPerStep() >= myPlanet.getRecruitingPerStep()) continue;
        }

        var fleetSize = Math.ceil(target.getForces() / fleetSize) * fleetSize;
        this.sendFleet(myPlanet, destination, Math.min(available, fleetSize));
    }
};