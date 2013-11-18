KamikazePlayer: function KamikazePlayer() {
    this.color = "salmon";
    this.initialize();
};
KamikazePlayer.prototype = new Player();
KamikazePlayer.prototype.constructor = KamikazePlayer;

KamikazePlayer.prototype.think = function think(universe) {
    var i,
        j,
        myPlanets,
        enemyPlanets,
        curMax,
        enemyPlanet,
        myPlanet,
        myForces,
        enemyRecruiting,
        curTarget,
        targets;

    myPlanets = universe.getPlanets(this);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length == 0) return;

    curMax = 0;
    for (i = 0; enemyPlanet = enemyPlanets[i]; ++i) {
        enemyRecruiting = enemyPlanet.getRecruitingPerStep();
        if (enemyRecruiting > curMax) {
            curMax = enemyRecruiting;
        }
    }

    targets = [];
    for (i = 0; enemyPlanet = enemyPlanets[i]; ++i) {
        if (enemyPlanet.getRecruitingPerStep() == curMax) {
            targets.push(enemyPlanet);
        }
    }
    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        myForces = myPlanet.getForces();

        shuffleArray(targets);

        for (j = 0; curTarget = targets[j]; ++j) {
            if (myForces > curTarget.getForces()) {
                this.sendFleet(myPlanet, curTarget, myForces);
            }
        }
    }
};

var _constructor = KamikazePlayer;