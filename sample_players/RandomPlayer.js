RandomPlayer: function RandomPlayer() {
    this.color = [255, 0, 0]; //red
    this.initialize();
};
RandomPlayer.prototype = new Player();
RandomPlayer.prototype.constructor = RandomPlayer;
RandomPlayer.prototype.fleetSize = 25;
RandomPlayer.prototype.think = function think(universe) {
    var i,
        myPlanets,
        allPlanets,
        myPlanet,
        targetIndex,
        length,
        fleetSize;

    myPlanets = universe.getPlanets(this);
    if (myPlanets.length == 0) return;

    allPlanets = universe.getAllPlanets();
    length = allPlanets.length;

    fleetSize = this.fleetSize;
    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        if (myPlanet.getForces() > fleetSize) {
            targetIndex = Math.floor(Math.random() * length)
            this.sendFleet(myPlanet, allPlanets[targetIndex], fleetSize);
        }
    }
};

var _constructor = RandomPlayer;