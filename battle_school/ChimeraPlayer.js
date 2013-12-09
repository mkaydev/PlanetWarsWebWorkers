importScripts("battle_school/AspPlayer.js");

ChimeraPlayer: function ChimeraPlayer() {
    this.color = [218, 165, 32]; //Goldenrod
    this.initialize();
    this.setStrategies();
    this.round = 0;
};

ChimeraPlayer.prototype = new AspPlayer();
ChimeraPlayer.prototype.constructor = ChimeraPlayer;

ChimeraPlayer.prototype.setStrategies = function setStrategies() {
    this.strategies = {
        "aspFutureProduction": new AspFutureProductionStrategy().setPlayer(this),
        "scorpionFutureProduction": new ScorpionFutureProductionStrategy().setPlayer(this),
        "ratNearestEnemy": new RatPlayerFinalStrategy().setPlayer(this),
        "badgerRecruitingCenter": new BadgerConquerRecruitingCenterStrategy().setPlayer(this),
  //      "ratRecruitingCenter": new RatPlayerMiddleStrategy().setPlayer(this),
        "badgerClosestCorner": new BadgerConquerClosestCornerStrategy().setPlayer(this),
        "salamanderClosestCorner": new SalamanderConquerClosestCornerStrategy().setPlayer(this)
    };
};

ChimeraPlayer.prototype.think = function think(universe) {
    var i,
        activePlayers,
        initialRounds,
        finalFactor,
        myPlanets,
        strategy,
        planets,
        myForces,
        otherForces,
        other,
        playersLen,
        planPerPlayer;

    initialRounds = 50;
    finalFactor = 3/4;

    ++this.round;

    activePlayers = universe.getActivePlayers();
    playersLen = activePlayers.length;

    myPlanets = universe.getPlanets(this);
    planets = universe.getAllPlanets();

    planPerPlayer = planets.length / playersLen;

    strategy = null;

    if (this.round < initialRounds) {

        if (playersLen == 2) {
            strategy = "scorpionFutureProduction";
        } else if (playersLen <= 5) {
            strategy = "badgerClosestCorner";
        } else {
            strategy = "salamanderClosestCorner";
        }

    } else {

        myForces = universe.getForces(this);
        otherForces = 0;

        universe.sortPlayersByForces(activePlayers, true);

        for (i = 0; other = activePlayers[i]; ++i) {
            if (other.equals(this)) continue;

            otherForces += universe.getForces(other);
        }

        if ((finalFactor * myForces > otherForces) && (myPlanets.length > planPerPlayer)) {
            strategy = "ratNearestEnemy";

        } else {

            if (playersLen > 2 && playersLen < 7) {

                if (this.round % 100 < 50) {
                    strategy = "aspFutureProduction";
                } else {
                    strategy = "badgerClosestCorner";
                }

            } else {

                if (this.round % 100 < 50) {
                    strategy = "scorpionFutureProduction";
                } else {
                    strategy = "badgerRecruitingCenter";
                }
            }
        }
    }
    this.strategies[strategy].think(universe);
};

var _constructor = ChimeraPlayer;

