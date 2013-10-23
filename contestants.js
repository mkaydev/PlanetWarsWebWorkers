var getContestants = function getContestants() {

    var contestants = [
        /*
         RandomPlayer,
         AttackRandomPlayer,
         AttackLargestEmpirePlayer,
         KamikazePlayer,
         AttackBestPlanetPlayer,

         DoNothingPlayer,
         VirusPlayer,
         AlbatrossPlayer,
         SupportNetworkPlayer,
         */


        AttackNearestEnemyPlayer,
        RatPlayer

    ];
    var result = [];
    for (var i = 0; i < contestants.length; i++) {
        result.push(new contestants[i]());
    }
    return result;
};


