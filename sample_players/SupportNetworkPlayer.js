SupportNetworkPlayer: function SupportNetworkPlayer() {
    this.color = [0, 255, 255]; //aqua
    this.initialize();
};
SupportNetworkPlayer.prototype = new Player();
SupportNetworkPlayer.prototype.constructor = SupportNetworkPlayer;
SupportNetworkPlayer.prototype.reserveFactor = 10;
SupportNetworkPlayer.prototype.fleetSize = 30;
SupportNetworkPlayer.prototype.support = 2.5;

SupportNetworkPlayer.prototype.think = function think(universe) {
    var i,
        myPlanets,
        enemyPlanets,
        reserveFactor,
        fleetSize,
        support,
        myPlanet,
        available,
        target,
        destination;

    myPlanets = universe.getPlanets(this);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length == 0) return;

    reserveFactor = this.reserveFactor;
    fleetSize = this.fleetSize;
    support = this.support;

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        target = enemyPlanets[0];
        destination = this.getNextDestination(universe, myPlanet, target, support);

        this.sendFleet(myPlanet, destination, fleetSize);
    }
};

SupportNetworkPlayer.prototype.getLastHop = function getLastHop(universe, source, target, support) {
    var i,
        minDist,
        destination,
        myPlanets,
        dist,
        myPlanet;

    if (typeof target === "undefined") return;

    minDist = Math.pow(source.distanceTo(target), support);
    destination = target;

    myPlanets = universe.getPlanets(this);

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        if (myPlanet.equals(source)) continue;

        dist = Math.pow(myPlanet.distanceTo(target), support) + source.distanceTo(myPlanet);
        if (dist < minDist) {
            minDist = dist;
            destination = myPlanet;
        }
    }
    return destination;
};

SupportNetworkPlayer.prototype.getNextDestination = function getNextDestination(universe, source, target, support) {
    var lastHop,
        hopBeforeLast;

    if (typeof target === "undefined") return;

    lastHop = this.getLastHop(universe, source, target, support);
    hopBeforeLast = this.getLastHop(universe, source, lastHop, support);

    while (!hopBeforeLast.equals(lastHop)) {
        lastHop = hopBeforeLast;
        hopBeforeLast = this.getLastHop(universe, source, lastHop, support);
    }
    return lastHop;
};

var _constructor = SupportNetworkPlayer;