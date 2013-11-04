RandomPlayer: function RandomPlayer() {
    this.color = "red";
    this.initialize();
};
RandomPlayer.prototype = new Player();
RandomPlayer.prototype.constructor = RandomPlayer;
RandomPlayer.prototype.think = function think(universe) {
    var fleetSize = 25;

    var myPlanets = universe.getPlanets(this);
    var allPlanets = universe.getAllPlanets();

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        if (myPlanet.forces > fleetSize) {
            var targetIndex = Math.floor(Math.random() * allPlanets.length)
            this.sendFleet(myPlanet, allPlanets[targetIndex], fleetSize);
        }
    }
};

var _constructor = RandomPlayer;