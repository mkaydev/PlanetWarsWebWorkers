importScripts("sample_players/SupportNetworkPlayer.js");

AlbatrossPlayer: function AlbatrossPlayer() {
    this.color = "purple";
    this.initialize();
};
AlbatrossPlayer.prototype = new SupportNetworkPlayer();
AlbatrossPlayer.prototype.constructor = AlbatrossPlayer;

AlbatrossPlayer.prototype.think = function think(universe) {
    var fleetSize = 25;
    var reserveFactor = 10;
    var support = 3;

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length == 0) return;


    for (var i = 0; i < myPlanets.length; ++i) {
        var myPlanet = myPlanets[i];
        var myForces = myPlanet.getForces();
        var myRecruiting = myPlanet.getRecruitingPerStep();

        var available = myForces - reserveFactor * myRecruiting;
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        var target = enemyPlanets[0];
        var destination = this.getNextDestination(universe, myPlanet, target, support);

        var targetForces = target.getForces();
        if (target === destination) {
            if (targetForces > available && target.getRecruitingPerStep() >= myRecruiting) continue;
        }

        var fleetSize = Math.ceil(targetForces / fleetSize) * fleetSize;
        this.sendFleet(myPlanet, destination, Math.min(available, fleetSize));
    }
};

var _constructor = AlbatrossPlayer;