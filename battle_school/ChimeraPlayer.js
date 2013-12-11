importScripts("battle_school/AspPlayer.js");

ChimeraPlayer: function ChimeraPlayer() {
    this.color = [0, 128, 128]; //Teal
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
        "ratRecruitingCenter": new RatPlayerMiddleStrategy().setPlayer(this),
        "badgerClosestCorner": new BadgerConquerClosestCornerStrategy().setPlayer(this),
//        "salamanderClosestCorner": new SalamanderConquerClosestCornerStrategy().setPlayer(this),
        "salamanderFirstCorner": new SalamanderConquerFirstCornerStrategy().setPlayer(this)
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
        planPerPlayer,
        ratio,
        roundsPerPhase;

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
        } else if (playersLen <= 6) {
            strategy = "aspFutureProduction";
        } else {
            strategy = "salamanderFirstCorner";
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

            if (playersLen == 2) {
                ratio = 0.5;
                roundsPerPhase = 100;
            } else  if (playersLen <= 5) {
                ratio = 0.33;
                roundsPerPhase = 200;
            } else if (playersLen <= 7) {
                ratio = 0.5;
                roundsPerPhase = 200;
            } else {
                ratio = 0.67;
                roundsPerPhase = 200;
            }

            if (this.round % roundsPerPhase < ratio * roundsPerPhase) {

                if (playersLen == 2) {
                    strategy = "badgerRecruitingCenter";
                } else if (playersLen > 2 && playersLen < 5) {

                    if (playersLen % 2 == 1 && this.round > 2 * initialRounds) {
                        strategy = "badgerRecruitingCenter";
                    } else {
                        strategy = "badgerClosestCorner";
                    }
                } else {
                    strategy = "ratRecruitingCenter";
                }


            } else {

                if (playersLen == 2 || playersLen > 5) {
                    strategy = "scorpionFutureProduction";
                } else {
                    strategy = "aspFutureProduction";
                }

            }
        }
    }
    this.strategies[strategy].think(universe);
};

var _constructor = ChimeraPlayer;

