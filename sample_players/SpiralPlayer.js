SpiralPlayer: function SpiralPlayer() {
    this.destinations = {};
};
SpiralPlayer.prototype = new Player();
SpiralPlayer.prototype.constructor = SpiralPlayer;
SpiralPlayer.prototype.reserveFactor = 10;
SpiralPlayer.prototype.minFleetSize = 25;

SpiralPlayer.prototype.think = function think(universe) {
    var i,
        j,
        id,
        myPlanet,
        myPlanets,
        enemyPlanets,
        length,
        centralPlanet,
        available,
        fleetSize,
        planetKey,
        destination,
        destinationKey,
        destinations,
        reserveFactor,
        minFleetSize;

    myPlanets = universe.getPlanets(this);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this);
    length = enemyPlanets.length;
    if (length == 0) return;

    universe.sortByRecruitingPower(myPlanets, true);
    centralPlanet = myPlanets[0];

    minFleetSize = this.minFleetSize;
    reserveFactor = this.reserveFactor;
    destinations = this.destinations;

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < minFleetSize) continue;
        fleetSize = Math.max(minFleetSize, Math.floor(available / 2));

        this.sortByDistance(centralPlanet, myPlanet, enemyPlanets);

        planetKey = myPlanet.getId();
        if (destinations.hasOwnProperty(planetKey)) {
            destinationKey = destinations[planetKey];
            destination = universe.getPlanet(destinationKey);
            this.sendFleet(myPlanet, destination, fleetSize);
        } else {
            for (j = 0; destination = enemyPlanets[j]; ++j) {
                id = destination.getId();
                if (!destinations.hasOwnProperty(id)) break;
            }
            if (typeof destination === "undefined") {
                destination = enemyPlanets[0];
                id = destination.getId();
            }
            destinations[planetKey] = id;
            this.sendFleet(myPlanet, destination, fleetSize);
        }
    }
};

SpiralPlayer.prototype.sortByDistance = function sortByDistance(central, planet, planets) {
    var sortByDist = function sortByDist(a, b) {
        var distA, distB;
        distA = planet.distanceTo(a) + central.distanceTo(a);
        distB = planet.distanceTo(b) + central.distanceTo(b);
        return distA - distB;
    };
    planets.sort(sortByDist);
};

var _constructor = SpiralPlayer;