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
};

var _constructor = KamikazePlayer;