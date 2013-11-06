SupportNetworkPlayer: function SupportNetworkPlayer() {
    this.color = "aqua";
    this.initialize();
};
SupportNetworkPlayer.prototype = new Player();
SupportNetworkPlayer.prototype.constructor = SupportNetworkPlayer;

SupportNetworkPlayer.prototype.think = function think(universe) {
    var reserveFactor = 10;
    var fleetSize = 30;
    var support = 2.5;

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length === 0) return;

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);
        var target = enemyPlanets[0];
        var destination = this.getNextDestination(universe, myPlanet, target, support);

        this.sendFleet(myPlanet, destination, fleetSize);
    }
};

SupportNetworkPlayer.prototype.getLastHop = function getLastHop(universe, source, target, support) {
    if (typeof target === "undefined") {
        return;
    }
    var minDist = Math.pow(source.distanceTo(target), support);
    var destination = target;

    var myPlanets = universe.getPlanets(this);

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        if (myPlanet === source) continue;

        var dist = Math.pow(myPlanet.distanceTo(target), support) + source.distanceTo(myPlanet);
        if (dist < minDist) {
            minDist = dist;
            destination = myPlanet;
        }
    }
    return destination;
};

SupportNetworkPlayer.prototype.getNextDestination = function getNextDestination(universe, source, target, support) {
    if (typeof target === "undefined") return;
    var lastHop = this.getLastHop(universe, source, target, support);
    var hopBeforeLast = this.getLastHop(universe, source, lastHop, support);

    while (hopBeforeLast !== lastHop) {
        lastHop = hopBeforeLast;
        hopBeforeLast = this.getLastHop(universe, source, lastHop, support);
    }
    return lastHop;
};

var _constructor = SupportNetworkPlayer;