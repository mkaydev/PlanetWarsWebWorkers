function Tournament(contestants, duel, repetitions) {
    this.repetitions = repetitions;
    this.duel = duel;
    this.contestants = contestants;
}

Tournament.prototype.setRepetitions = function setRepetitions(repetitions) {
    this.repetitions = repetitions;
};

Tournament.prototype.initialize = function initialize() {
    var i, j, cycle, rep, contestants, contLen, gamesToPlay;
    rep = this.repetitions;
    contestants = this.contestants;
    contLen = contestants.length;
    gamesToPlay = [];

    if (!this.duel) {
        for (i = 0; i < rep; ++i) {
            gamesToPlay.push(contestants);
        }

    } else {

        cycle = [];
        for (i = 0; i < contLen; ++i) {
            for(j = i + 1; j < contLen; ++j) {
                cycle.push([contestants[i], contestants[j]]);
            }
        }

        for (i = 0; i < rep; ++i) {
            gamesToPlay.push.apply(gamesToPlay, cycle);
        }
    }

    this.gamesToPlay = gamesToPlay;
    this.gameIndex = 0;
};

Tournament.prototype.initializePoints = function initializePoints(activePlayers) {
    var i, contestant, points, player;
    points = this.points;

    if (typeof points === "undefined") points = {};

    for (i = 0; player = activePlayers[i]; ++i) {
        contestant = player.name;
        if (!points.hasOwnProperty(contestant)) points[contestant] = 0;
    }

    this.points = points;
};

Tournament.prototype.addResultSummary = function addResultSummary(resultSummary) {
    var i, winner, survivor, players, playersLen;
    players = resultSummary.players;
    playersLen = players.length;

    if (playersLen == 1) {
        winner = players[0].name;
        this.addPoints(winner, 2);

    } else {

        for (i = 0; survivor = players[i]; ++i) {
            this.addPoints(survivor.name, 1);
        }
    }
    this.gameIndex += 1;
    console.log(this.points);
    if (this.gameIndex >= this.gamesToPlay.length) this.points = {};
};

Tournament.prototype.addPoints = function addPoints(playerName, points) {
    var curPoints = this.points;

    if (curPoints.hasOwnProperty(playerName)) {
        curPoints[playerName] += points;
    } else {
        curPoints[playerName] = points;
    }
};

Tournament.prototype.getNextPlayers = function getNextPlayers() {
    return this.gamesToPlay[this.gameIndex];
};