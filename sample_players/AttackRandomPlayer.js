AttackRandomPlayer: function AttackRandomPlayer() {};
AttackRandomPlayer.prototype = new Player();
AttackRandomPlayer.prototype.constructor = AttackRandomPlayer;
AttackRandomPlayer.prototype.fleetSize = 25;

AttackRandomPlayer.prototype.think = function think(universe) {
    var i,
        myPlanet,
        myPlanets,
        enemyPlanets,
        targetIndex,
        length,
        fleetSize;

    myPlanets = universe.getPlanets(this);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this);
    length = enemyPlanets.length;
    if (length == 0) return;

    fleetSize = this.fleetSize;
    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        if (myPlanet.getForces() > fleetSize) {
            targetIndex = Math.floor(Math.random() * length)
            this.sendFleet(myPlanet, enemyPlanets[targetIndex], fleetSize);
        }
    }
};

var _constructor = AttackRandomPlayer;