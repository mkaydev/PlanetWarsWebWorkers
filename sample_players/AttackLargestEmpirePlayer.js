AttackLargestEmpirePlayer: function AttackLargestEmpirePlayer() {};
AttackLargestEmpirePlayer.prototype = new Player();
AttackLargestEmpirePlayer.prototype.constructor = AttackLargestEmpirePlayer;
AttackLargestEmpirePlayer.prototype.fleetSize = 25;

AttackLargestEmpirePlayer.prototype.think = function think(universe) {
    var i,
        player,
        myPlanet,
        myPlanets,
        targetIndex,
        planets,
        curMax,
        curTargets,
        curTarLen,
        activePlayers,
        fleetSize;

    myPlanets = universe.getPlanets(this);
    if (myPlanets.length == 0) return;

    curMax = 0;
    curTargets = [];
    activePlayers = universe.getActivePlayers();

    for (i = 0; player = activePlayers[i]; ++i) {
        if (player.equals(this)) continue;

        planets = universe.getPlanets(player);
        if (planets.length > curMax) {
            curMax = planets.length;
            curTargets = planets;
        }
    }

    curTarLen = curTargets.length;
    if (curTarLen == 0) return;

    fleetSize = this.fleetSize;

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        if (myPlanet.getForces() > fleetSize) {
            targetIndex = Math.floor(Math.random() * curTarLen);
            this.sendFleet(myPlanet, curTargets[targetIndex], fleetSize);
        }
    }
};

var _constructor = AttackLargestEmpirePlayer;