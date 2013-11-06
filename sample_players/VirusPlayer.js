VirusPlayer: function VirusPlayer() {
    this.color = "Olive";
    this.initialize();
};
VirusPlayer.prototype = new Player();
VirusPlayer.prototype.constructor = VirusPlayer;

VirusPlayer.prototype.think = function think(universe) {
    var fleetSize = 25;
    var reserveFactor = 10;
    var fullOutFactor = 3;

    this.evaluateVictim = function evaluateVictim(target, attacker) {
        var defendingForces = target.getForces();
        var defendingFleets = target.getDefendingFleets();
        for (var i = 0; i < defendingFleets.length; i++) {
            defendingForces += defendingFleets[i].getForces();
        }

        var attackingFleets = target.getAttackingFleets();
        for (var i = 0; i < attackingFleets.length; i++) {
            defendingForces -= attackingFleets[i].getForces();
        }

        var attackerForces = attacker.getForces();
        var evaluation = {
            "attack": defendingForces < fleetSize || attackerForces > fullOutFactor * defendingForces,
            "fullOut": attackerForces > fullOutFactor * defendingForces
        };

        return evaluation;
    }.bind(this);

    var myPlanets = universe.getPlanets(this);
    var enemyPlanets = universe.getEnemyPlanets(this);

    for (var i = 0; i < myPlanets.length; i++) {
        var myPlanet = myPlanets[i];
        var available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);

        var foundVictim = false;

        for (var j = 0; j < enemyPlanets.length; j++ ) {

            var target = enemyPlanets[j];
            var evaluation = this.evaluateVictim(target, myPlanet);

            if (evaluation.attack) {

                if (evaluation.fullOut) {
                    var attackSize =  Math.max(Math.floor(available / fullOutFactor), fleetSize);
                    this.sendFleet(myPlanet, target, attackSize);
                    available -= attackSize;
                } else {
                    this.sendFleet(myPlanet, target, fleetSize);
                    available -= fleetSize;
                }

                foundVictim = true;
            }

            if (available < fleetSize) break;
        }

        if (available > fleetSize && !foundVictim) {
            var destination = this.getPlanetWithMaxForce(myPlanets);
            if (myPlanet !== destination) this.sendFleet(myPlanet, destination, Math.max(Math.floor(available / fullOutFactor), fleetSize));
        };
    }
};

VirusPlayer.prototype.getPlanetWithMaxForce = function getPlanetWithMaxForce(planets) {
    var curMax = 0;
    var curPlanet;

    for (var i = 0; i < planets.length; i++) {
        var planet = planets[i];
        var forces = planet.getForces();
        if (forces > curMax) {
            curMax = forces;
            curPlanet = planet;
        }
    }
    return curPlanet;
};

var _constructor = VirusPlayer;