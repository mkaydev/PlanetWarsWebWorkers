var getContestants = function getContestants() {

    var contestants = [
        /*
         DoNothingPlayer,

         SpiralPlayer,
         KamikazePlayer,
         AttackBestPlanetPlayer,
         AttackLargestEmpirePlayer,

         RandomPlayer,
         AttackRandomPlayer,

         SupportNetworkPlayer,
         AlbatrossPlayer,
         AttackNearestEnemyPlayer,
         VirusPlayer,

         RatPlayer,
         */

        SupportNetworkPlayer,
        AlbatrossPlayer,
        AttackNearestEnemyPlayer,
        VirusPlayer,
        RatPlayer,

    ];
    var result = [];
    for (var i = 0; i < contestants.length; i++) {
        result.push(new contestants[i]());
    }
    shuffleArray(result);
    return result;
};


