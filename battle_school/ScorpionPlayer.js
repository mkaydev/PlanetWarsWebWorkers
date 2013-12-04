importScripts("battle_school/BadgerPlayer.js");


ScorpionPlayer: function ScorpionPlayer() {
    this.color = [220, 20, 60]; //Crimson
    this.initialize();
    this.setStrategies();
};
ScorpionPlayer.prototype = new Player();
ScorpionPlayer.prototype.constructor = ScorpionPlayer;

ScorpionPlayerStrategy: function ScorpionPlayerStrategy() {};
ScorpionPlayerStrategy.prototype = new BadgerPlayerStrategy();
ScorpionPlayerStrategy.prototype.constructor = ScorpionPlayerStrategy;

ScorpionFutureProductionStrategy: function ScorpionFutureProductionStrategy() {};
ScorpionFutureProductionStrategy.prototype = new ScorpionPlayerStrategy();
ScorpionFutureProductionStrategy.prototype.constructor = ScorpionFutureProductionStrategy;

ScorpionFutureProductionStrategy.prototype.think = function think(universe) {
    var i,
        myPlanets,
        myPlanet,
        enemyPlanets,
        target,
        enemyNeededMap,
        myNeededMap,
        available,
        needed,
        reserveFactor,
        desiredReserveFactor,
        desiredFleetSize,
        fleetSize,
        cluster,
        destination,
        stepsToEnemy,
        stepsTo;

    this.setupRound(universe);

    myPlanets = universe.getPlanets(this.player);
    if (myPlanets.length == 0) return;

    enemyPlanets = universe.getEnemyPlanets(this.player);
    if (enemyPlanets.length == 0) return;

    enemyNeededMap = this.getNeededMap(enemyPlanets);
    myNeededMap = this.getNeededMap(myPlanets);

    for (i = 0; myPlanet = myPlanets[i]; ++i) {

        needed = myNeededMap[myPlanet.getId()];
        if (needed > 0) continue;

        reserveFactor = this.getReserveFactor(myPlanet);
        available = Math.min((-needed), myPlanet.getForces()) - reserveFactor * myPlanet.getRecruitingPerStep();

        while (available > 5) {
            target = this.getTarget(myPlanet, available, enemyPlanets, enemyNeededMap);
            if (typeof target === "undefined") break;

            cluster = this.getFriendlyCluster(target);
            destination = cluster[0];

            desiredReserveFactor = this.getReserveFactor(target);
            desiredFleetSize = enemyNeededMap[target.getId()] + desiredReserveFactor * target.getRecruitingPerStep();
            fleetSize = Math.min(desiredFleetSize, available);

            if (destination.equals(myPlanet)) destination = target;
            if (destination.ownerEquals(this.player)) {
                stepsToEnemy = this.getStepsToEnemy(destination);
                stepsTo = myPlanet.fleetStepsTo(destination);
                if (stepsTo < stepsToEnemy){
                    myNeededMap[destination.getId()] -= fleetSize;
                }
            } else {
                enemyNeededMap[destination.getId()] -= fleetSize;
            }

            this.player.sendFleet(myPlanet, destination, fleetSize);
            available -= fleetSize;
        }
    }
};

ScorpionFutureProductionStrategy.prototype.getTarget = function getTarget(source, available, targets, enemyNeededMap) {
    var i,
        curStepsTo,
        curRatio,
        curTarget,
        target,
        ratio,
        stepsTo,
        needed,
        fleetSize,
        futureSight;

    futureSight = 30;
    curRatio = -Infinity;
    curStepsTo = Infinity;

    for (i = 0; target = targets[i]; ++i) {
        if (this.inTopForceEnemyPlanets(target, 5)) continue;
        needed = enemyNeededMap[target.getId()];
        if (needed <= 0) continue;

        fleetSize = Math.min(needed, available);
        stepsTo = source.fleetStepsTo(target);

        ratio = this.getFutureProductionRatio(target.getId(), stepsTo, fleetSize, targets, enemyNeededMap, futureSight);
        if (ratio < curRatio)  continue;

        if (stepsTo > curStepsTo) continue;

        curStepsTo = stepsTo;
        curRatio = ratio;
        curTarget = target;
    }

    return curTarget;
};

ScorpionFutureProductionStrategy.prototype.getFutureProductionRatio = function getFutureProductionRatio(targetId, stepsTo, fleetSize, targets, neededMap, futureSight) {
    var i,
        planetId,
        needed,
        enemyPlanet,
        myRecr,
        otherRecr;

    myRecr = 0;
    otherRecr = 0;

    for (i = 0; enemyPlanet = targets[i]; ++i) {
        planetId = enemyPlanet.getId();
        needed = neededMap[planetId];

        if (planetId == targetId) {
            needed -= fleetSize;
        };

        if (needed > 0) {
            otherRecr += enemyPlanet.getRecruitingPerStep() * futureSight;
        } else {
            if (planetId == targetId) {
                otherRecr += enemyPlanet.getRecruitingPerStep() * Math.min(stepsTo, futureSight);
                myRecr += enemyPlanet.getRecruitingPerStep * Math.max(0, futureSight - stepsTo);
            } else {
                myRecr += enemyPlanet.getRecruitingPerStep() * futureSight;
            }
        }
    }

    return myRecr / otherRecr;
};

ScorpionPlayer.prototype.setStrategies = function setStrategies() {
    this.strategies = {
        "futureProduction": new ScorpionFutureProductionStrategy().setPlayer(this),
        "attackNearestEnemy": new RatPlayerFinalStrategy().setPlayer(this)
    };
};

ScorpionPlayer.prototype.think = function think(universe) {
    var  i,
        activePlayers,
        finalFactor,
        myPlanets,
        strategy,
        planets,
        myForces,
        otherForces,
        other,
        playersLen,
        myLen,
        planPerPlayer;

    finalFactor = 2/3;

    activePlayers = universe.getActivePlayers();
    playersLen = activePlayers.length;

    myPlanets = universe.getPlanets(this);
    myLen = myPlanets.length;
    if (myLen == 0) return;

    planets = universe.getAllPlanets();
    planPerPlayer = planets.length / playersLen;

    strategy = null;
    myForces = universe.getForces(this);
    otherForces = 0;

    universe.sortPlayersByForces(activePlayers, true);
    for (i = 0; other = activePlayers[i]; ++i) {
        if (other.equals(this)) continue;

        otherForces += universe.getForces(other);
    }

    if ((finalFactor * myForces > otherForces) && (myPlanets.length > planPerPlayer)) {
        strategy = "attackNearestEnemy";
    } else {
        strategy = "futureProduction";
    }
    this.strategies[strategy].think(universe);
};

var _constructor = ScorpionPlayer;