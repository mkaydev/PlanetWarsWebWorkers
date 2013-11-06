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
        var enemyRecruiting = enemyPlanet.getRecruitingPerStep();
        if (enemyRecruiting > curMax) {
            curMax = enemyRecruiting;
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
        var myForces = myPlanet.getForces();

        shuffleArray(targets);

        for (var j = 0; j < targets.length; j++) {
            var curTarget = targets[j];
            var available = myForces - reserveFactor * myPlanet.getRecruitingPerStep();
            if (available > curTarget.getForces()) this.sendFleet(myPlanet, curTarget, myForces);
        }
    }
};

var _constructor = AttackBestPlanetPlayer;