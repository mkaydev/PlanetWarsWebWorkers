AttackNearestEnemyPlayer: function AttackNearestEnemyPlayer() {
    this.color = "orange";
    this.initialize();
};
AttackNearestEnemyPlayer.prototype = new Player();
AttackNearestEnemyPlayer.prototype.constructor = AttackNearestEnemyPlayer;
AttackNearestEnemyPlayer.prototype.reserveFactor = 10;
AttackNearestEnemyPlayer.prototype.fleetSize = 25;

AttackNearestEnemyPlayer.prototype.think = function think(universe) {
    var i,
        myPlanets,
        enemyPlanets,
        myPlanet,
        available,
        target,
        fleetSize,
        reserveFactor;

    myPlanets = universe.getPlanets(this);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length == 0) return;

    fleetSize = this.fleetSize;
    reserveFactor = this.reserveFactor;
    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        target = enemyPlanets[0];
        this.sendFleet(myPlanet, target, fleetSize);
    }
};

var _constructor = AttackNearestEnemyPlayer;