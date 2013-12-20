importScripts("sample_players/SupportNetworkPlayer.js");

AlbatrossPlayer: function AlbatrossPlayer() {};
AlbatrossPlayer.prototype = new SupportNetworkPlayer();
AlbatrossPlayer.prototype.constructor = AlbatrossPlayer;
AlbatrossPlayer.prototype.fleetSize = 25;
AlbatrossPlayer.prototype.reserveFactor = 10;
AlbatrossPlayer.prototype.support = 3;

AlbatrossPlayer.prototype.think = function think(universe) {
    var i,
        myPlanets,
        enemyPlanets,
        fleetSize,
        reserveFactor,
        support,
        myPlanet,
        myForces,
        myRecruiting,
        available,
        target,
        destination,
        targetForces;


    myPlanets = universe.getPlanets(this);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length == 0) return;

    fleetSize = this.fleetSize;
    reserveFactor = this.reserveFactor;
    support = this.support;

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        myForces = myPlanet.getForces();
        myRecruiting = myPlanet.getRecruitingPerStep();

        available = myForces - reserveFactor * myRecruiting;
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        target = enemyPlanets[0];
        destination = this.getNextDestination(universe, myPlanet, target, support);

        targetForces = target.getForces();
        if (target.equals(destination)) {
            if (targetForces > available && target.getRecruitingPerStep() >= myRecruiting) continue;
        }

        fleetSize = Math.ceil(targetForces / fleetSize) * fleetSize;
        this.sendFleet(myPlanet, destination, Math.min(available, fleetSize));
    }
};

var _constructor = AlbatrossPlayer;