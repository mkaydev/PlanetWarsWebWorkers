var getContestants = function getContestants() {

    var contestants = [
        /*
         RandomPlayer,
         AttackRandomPlayer,
         AttackLargestEmpirePlayer,
         KamikazePlayer,
         AttackBestPlanetPlayer,
         DoNothingPlayer,
         SupportNetworkPlayer,
         */

        AttackNearestEnemyPlayer,
        AlbatrossPlayer,
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


