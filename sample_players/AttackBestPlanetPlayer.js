AttackBestPlanetPlayer: function AttackBestPlanetPlayer() {
    this.color = [250, 235, 215]; //AntiqueWhite
    this.initialize();
};
AttackBestPlanetPlayer.prototype = new Player();
AttackBestPlanetPlayer.prototype.constructor = AttackBestPlanetPlayer;
AttackBestPlanetPlayer.prototype.reserveFactor = 10;

AttackBestPlanetPlayer.prototype.think = function think(universe) {
    var i,
        j,
        myPlanets,
        enemyPlanets,
        curMax,
        enemyRecruiting,
        targets,
        enemyPlanet,
        myPlanet,
        myForces,
        curTarget,
        available,
        reserveFactor;

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

    reserveFactor = this.reserveFactor;
    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        myForces = myPlanet.getForces();

        shuffleArray(targets);

        for (j = 0; curTarget = targets[j]; ++j) {
            available = myForces - reserveFactor * myPlanet.getRecruitingPerStep();
            if (available > curTarget.getForces()) {
                this.sendFleet(myPlanet, curTarget, myForces);
            }
        }
    }
};

var _constructor = AttackBestPlanetPlayer;