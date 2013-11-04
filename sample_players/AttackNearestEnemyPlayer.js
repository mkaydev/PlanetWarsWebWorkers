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
        var available = myPlanet.forces - reserveFactor * myPlanet.recruitingPerStep;
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        var target = enemyPlanets[0];
        this.sendFleet(myPlanet, target, fleetSize);
    }
};

var _constructor = AttackNearestEnemyPlayer;