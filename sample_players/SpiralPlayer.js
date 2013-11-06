SpiralPlayer: function SpiralPlayer() {
    this.color = "Chocolate";
    this.initialize();

    this.destinations = {};
};
SpiralPlayer.prototype = new Player();
SpiralPlayer.prototype.constructor = SpiralPlayer;

SpiralPlayer.prototype.think = function think(universe) {
    var reserveFactor = 10;
    var minFleetSize = 25;

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);
    if (enemyPlanets.length === 0) return;

    universe.sortByRecruitingPower(myPlanets);
    var centralPlanet = myPlanets[0];
    if (typeof centralPlanet === "undefined") return;

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < minFleetSize) continue;
        var fleetSize = Math.max(minFleetSize, Math.floor(available / 2));

        this.sortByDistance(centralPlanet, myPlanet, enemyPlanets);

        var planetKey = myPlanet.x + " " + myPlanet.y;
        if (!this.destinations.hasOwnProperty(planetKey)) {
            var destination = enemyPlanets[0];
            this.destinations[planetKey] = destination;
            this.sendFleet(myPlanet, destination, fleetSize);
        } else {
            var destination = this.destinations[planetKey];
            this.sendFleet(myPlanet, destination, fleetSize);
        }
    }
};

SpiralPlayer.prototype.sortByDistance = function sortByDistance(central, planet, planets) {
    var sortByDist = function sortByDist(a, b) {
        var distA = planet.distanceTo(a) + central.distanceTo(a);
        var distB = planet.distanceTo(b) + central.distanceTo(b);
        return distA - distB;
    };
    planets.sort(sortByDist);
};

var _constructor = SpiralPlayer;