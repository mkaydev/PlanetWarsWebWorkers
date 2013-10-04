
RandomPlayer.prototype = new Player();
RandomPlayer.prototype.constructor = RandomPlayer;
function RandomPlayer() {
    this.color = "red";
}
RandomPlayer.prototype.think = function think() {
    var myPlanets = this.universe.getPlanets(this);
    var allPlanets = this.universe.getAllPlanets();

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        if (myPlanet.forces > this.fleetSize) {
            var targetIndex = Math.floor(Math.random() * allPlanets.length)
            this.sendFleet(myPlanet, allPlanets[targetIndex], this.fleetSize);
        }
    }
}

AttackRandomPlayer.prototype = new Player();
AttackRandomPlayer.prototype.constructor = AttackRandomPlayer;
function AttackRandomPlayer() {
    this.color = "blue";
}
AttackRandomPlayer.prototype.think = function think() {
    var myPlanets = this.universe.getPlanets(this);
    var enemyPlanets = this.universe.getEnemyPlanets(this);

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        if (myPlanet.forces > this.fleetSize) {
            var targetIndex = Math.floor(Math.random() * enemyPlanets.length)
            this.sendFleet(myPlanet, enemyPlanets[targetIndex], this.fleetSize);
        }
    }
}

DoNothingPlayer.prototype = new Player();
DoNothingPlayer.prototype.constructor = DoNothingPlayer;
function DoNothingPlayer() {
    this.color = "yellow";
}

AttackLargestEmpirePlayer.prototype = new Player();
AttackLargestEmpirePlayer.prototype.constructor = AttackLargestEmpirePlayer;
function AttackLargestEmpirePlayer() {
    this.color = "green";
}
AttackLargestEmpirePlayer.prototype.think = function think() {
    var curMax = 0;
    var curTargets = [];

    for (var i = 0; i < this.universe.activePlayers.length; i++) {
        if (this.universe.activePlayers[i] === this) continue;
        var planets = this.universe.getPlanets(this.universe.activePlayers[i]);
        if (planets.length > curMax) {
            curMax = planets.length;
            curTargets = planets;
        }
    }

    if (curTargets.length == 0) return;

    var myPlanets = this.universe.getPlanets(this);

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        if (myPlanet.forces > this.fleetSize) {
            var targetIndex = Math.floor(Math.random() * curTargets.length);
            this.sendFleet(myPlanet, curTargets[targetIndex], this.fleetSize);
        }
    }
}

KamikazePlayer.prototype = new Player();
KamikazePlayer.prototype.constructor = KamikazePlayer;
function KamikazePlayer() {
    this.color = "salmon";
}
KamikazePlayer.prototype.think = function think() {
    var myPlanets = this.universe.getPlanets(this);
    var enemyPlanets = this.universe.getEnemyPlanets(this);

    var curMax = 0;
    for (var i = 0; i < enemyPlanets.length; i++) {
        var enemyPlanet = enemyPlanets[i];
        if (enemyPlanet.recruitingPerStep > curMax) {
            curMax = enemyPlanet.recruitingPerStep;
        }
    }

    var targets = [];
    for (var i = 0; i < enemyPlanets.length; i++) {
        var enemyPlanet = enemyPlanets[i];
        if (enemyPlanet.recruitingPerStep === curMax) {
            targets.push(enemyPlanet);
        }
    }
    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        shuffleArray(targets);
        for (var j = 0; j < targets.length; j++) {
            var curTarget = targets[j];
            if (myPlanet.forces > curTarget.forces) this.sendFleet(myPlanet, curTarget, myPlanet.forces);
        }
    }
}

AttackBestPlanetPlayer.prototype = new Player();
AttackBestPlanetPlayer.prototype.reserveFactor = 10;
AttackBestPlanetPlayer.prototype.constructor = AttackBestPlanetPlayer;
function AttackBestPlanetPlayer() {
    this.color = "AntiqueWhite ";
}
AttackBestPlanetPlayer.prototype.think = function think() {
    var myPlanets = this.universe.getPlanets(this);
    var enemyPlanets = this.universe.getEnemyPlanets(this);

    var curMax = 0;
    for (var i = 0; i < enemyPlanets.length; i++) {
        var enemyPlanet = enemyPlanets[i];
        if (enemyPlanet.recruitingPerStep > curMax) {
            curMax = enemyPlanet.recruitingPerStep;
        }
    }

    var targets = [];
    for (var i = 0; i < enemyPlanets.length; i++) {
        var enemyPlanet = enemyPlanets[i];
        if (enemyPlanet.recruitingPerStep === curMax) {
            targets.push(enemyPlanet);
        }
    }
    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        shuffleArray(targets);
        for (var j = 0; j < targets.length; j++) {
            var curTarget = targets[j];
            var available = myPlanet.forces - this.reserveFactor * myPlanet.recruitingPerStep;
            if (available > curTarget.forces) this.sendFleet(myPlanet, curTarget, myPlanet.forces);
        }
    }
}

AttackNearestEnemyPlayer.prototype = new Player();
AttackNearestEnemyPlayer.prototype.constructor = AttackNearestEnemyPlayer;
function AttackNearestEnemyPlayer() {
    this.color = "orange";
}
AttackNearestEnemyPlayer.prototype.reserveFactor = 10;
AttackNearestEnemyPlayer.prototype.fleetSize = 25;
AttackNearestEnemyPlayer.prototype.think = function think() {
    var myPlanets = this.universe.getPlanets(this);
    var enemyPlanets = this.universe.getEnemyPlanets(this);

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.forces - this.reserveFactor * myPlanet.recruitingPerStep;
        if (available < this.fleetSize) continue;

        var target = this.getNearest(myPlanet, enemyPlanets);
        this.sendFleet(myPlanet, target, this.fleetSize);
    }
}
