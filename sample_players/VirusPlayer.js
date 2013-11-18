VirusPlayer: function VirusPlayer() {
    this.color = "Olive";
    this.initialize();
};
VirusPlayer.prototype = new Player();
VirusPlayer.prototype.constructor = VirusPlayer;

VirusPlayer.prototype.fleetSize = 25;
VirusPlayer.prototype.reserveFactor = 10;
VirusPlayer.prototype.fullOutFactor = 3;

VirusPlayer.prototype.think = function think(universe) {
    var i,
        j,
        myPlanets,
        myPlanet,
        enemyPlanets,
        available,
        fleetSize,
        reserveFactor,
        fullOutFactor,
        target,
        evaluation,
        foundVictim,
        attackSize,
        destination;


    myPlanets = universe.getPlanets(this);
    if (myPlanets.length == 0) return;
    enemyPlanets = universe.getEnemyPlanets(this);

    fleetSize = this.fleetSize;
    fullOutFactor = this.fullOutFactor;
    reserveFactor = this.reserveFactor;

    for (i = 0; myPlanet = myPlanets[i]; ++i) {
        available = myPlanet.getForces() - reserveFactor * myPlanet.getRecruitingPerStep();
        if (available < fleetSize) continue;

        universe.sortByDistance(myPlanet, enemyPlanets);

        foundVictim = false;

        for (j = 0; target = enemyPlanets[j]; ++j ) {
            evaluation = this.evaluateVictim(target, myPlanet);

            if (evaluation.attack) {

                if (evaluation.fullOut) {
                    attackSize =  Math.max(Math.floor(available / fullOutFactor), fleetSize);
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
            destination = this.getPlanetWithMaxForce(myPlanets);
            if (!myPlanet.equals(destination)) {
                this.sendFleet(myPlanet, destination, Math.max(Math.floor(available / fullOutFactor), fleetSize));
            }
        };
    }
};

VirusPlayer.prototype.evaluateVictim = function evaluateVictim(target, attacker) {
    var i,
        fleet,
        defendingForces,
        defendingFleets,
        attackerForces,
        attackingFleets,
        evaluation;

    defendingForces = target.getForces();
    defendingFleets = target.getDefendingFleets();

    for (i = 0; fleet = defendingFleets[i]; ++i) {
        defendingForces += fleet.getForces();
    }

    attackingFleets = target.getAttackingFleets();
    for (i = 0; fleet = attackingFleets[i]; ++i) {
        defendingForces -= fleet.getForces();
    }

    attackerForces = attacker.getForces();
    evaluation = {
        "attack": defendingForces < this.fleetSize || attackerForces > this.fullOutFactor * defendingForces,
        "fullOut": attackerForces > this.fullOutFactor * defendingForces
    };

    return evaluation;
};

VirusPlayer.prototype.getPlanetWithMaxForce = function getPlanetWithMaxForce(planets) {
    var i, planet, forces, curPlanet, curMax;
    curMax = 0;

    for (i = 0; planet = planets[i]; ++i) {
        forces = planet.getForces();
        if (forces > curMax) {
            curMax = forces;
            curPlanet = planet;
        }
    }
    return curPlanet;
};

var _constructor = VirusPlayer;