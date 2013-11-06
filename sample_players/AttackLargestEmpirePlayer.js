AttackLargestEmpirePlayer: function AttackLargestEmpirePlayer() {
    this.color = "green";
    this.initialize();
};
AttackLargestEmpirePlayer.prototype = new Player();
AttackLargestEmpirePlayer.prototype.constructor = AttackLargestEmpirePlayer;

AttackLargestEmpirePlayer.prototype.think = function think(universe) {
    var fleetSize = 25;

    var curMax = 0;
    var curTargets = [];
    var activePlayers = universe.getActivePlayers();

    for (var i = 0; i < activePlayers.length; i++) {
        if (activePlayers[i] === this) continue;
        var planets = universe.getPlanets(activePlayers[i]);
        if (planets.length > curMax) {
            curMax = planets.length;
            curTargets = planets;
        }
    }

    if (curTargets.length == 0) return;

    var myPlanets = universe.getPlanets(this);

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        if (myPlanet.getForces() > fleetSize) {
            var targetIndex = Math.floor(Math.random() * curTargets.length);
            this.sendFleet(myPlanet, curTargets[targetIndex], fleetSize);
        }
    }
};

var _constructor = AttackLargestEmpirePlayer;