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

var _constructor = AttackRandomPlayer;