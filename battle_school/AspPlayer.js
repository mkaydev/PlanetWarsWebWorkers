importScripts("battle_school/ScorpionPlayer.js");


AspPlayer: function AspPlayer() {
    this.setStrategies();
};
AspPlayer.prototype = new ScorpionPlayer();
AspPlayer.prototype.constructor = AspPlayer;

AspFutureProductionStrategy: function AspFutureProductionStrategy() {};
AspFutureProductionStrategy.prototype = new ScorpionFutureProductionStrategy();
AspFutureProductionStrategy.prototype.constructor = AspFutureProductionStrategy;
AspFutureProductionStrategy.prototype.setupRound = function setupRound(universe) {
    this.universe = universe;
    this.reserveCache = {};
    this.stepsToEnemyCache = {};
    this.inTopCache = {};
    this.topCache = [];
    this.immediateThreat = null;
};

AspFutureProductionStrategy.prototype.getMostImmediateThreat = function getMostImmediateThreat() {
    var i,
        j,
        myPlanets,
        myPlanet,
        attacking,
        fleet,
        fleetOwner,
        ownerId,
        forcesPerPlayer,
        curId,
        curMaxForces,
        forces,
        ownerIds,
        players;

    players = this.universe.getActivePlayers();
    curId = null;

    if (players.length > 2) {

        if (this.immediateThreat !== null) return this.immediateThreat;
        myPlanets = this.universe.getPlanets(this.player);
        forcesPerPlayer = {};
        ownerIds = [];

        for (i = 0; myPlanet = myPlanets[i]; ++i) {
            attacking = myPlanet.getAttackingFleets();

            for (j = 0; fleet = attacking[j]; ++j) {
                fleetOwner = fleet.getOwner();
                ownerId = fleetOwner.id;
                ownerIds.push(ownerId);

                if (forcesPerPlayer.hasOwnProperty(ownerId)) {
                    forcesPerPlayer[ownerId] += fleet.getForces();
                } else {
                    forcesPerPlayer[ownerId] = fleet.getForces();
                }
            }
        }

        curMaxForces = 0;

        for (i = 0; ownerId = ownerIds[i]; ++i) {
            forces = forcesPerPlayer[ownerId];
            if (forces >= curMaxForces) {
                curMaxForces = forces;
                curId = ownerId;
            }
        }

        if (curId === null) this.universe.sortPlayersByForces(players);
    }

    if (curId === null) {
        if (players[0].equals(this.player)) {
            curId = players[1].id;
        } else {
            curId = players[0].id;
        }
    }
    this.immediateThreat = curId;
    return curId;
};

// focuses on enemy, who is the most immediate threat
AspFutureProductionStrategy.prototype.getFutureProductionRatio = function getFutureProductionRatio(targetId, stepsTo, fleetSize, targets, neededMap, futureSight) {
    var i,
        planetId,
        needed,
        enemyPlanet,
        myRecr,
        otherRecr,
        owner,
        ownerId,
        immediateThreat;

    myRecr = 0;
    otherRecr = 0;
    immediateThreat = this.getMostImmediateThreat();

    for (i = 0; enemyPlanet = targets[i]; ++i) {
        planetId = enemyPlanet.getId();
        needed = neededMap[planetId];

        if (planetId == targetId) {
            needed -= fleetSize;
        };

        owner = enemyPlanet.getOwner();
        ownerId = owner.id;

        if (needed > 0) {
            if (ownerId == immediateThreat) {
                otherRecr += enemyPlanet.getRecruitingPerStep() * futureSight;
            }
        } else {
            if (planetId == targetId) {
                if (ownerId == immediateThreat) {
                    otherRecr += enemyPlanet.getRecruitingPerStep() * Math.min(stepsTo, futureSight);
                }
                myRecr += enemyPlanet.getRecruitingPerStep * Math.max(0, futureSight - stepsTo);
            } else {
                myRecr += enemyPlanet.getRecruitingPerStep() * futureSight;
            }
        }
    }

    return myRecr / otherRecr;
};

AspPlayer.prototype.setStrategies = function setStrategies() {
    this.strategies = {
        "futureProduction": new AspFutureProductionStrategy().setPlayer(this),
        "attackNearestEnemy": new RatPlayerFinalStrategy().setPlayer(this)
    };
};

var _constructor = AspPlayer;