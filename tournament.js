function Tournament(contestantFiles, duel, repetitions, tournamentOverview) {
    this.repetitions = repetitions;
    this.duel = duel;
    this.contestantFiles = contestantFiles;
    this.overview = tournamentOverview;
}

Tournament.prototype.setRepetitions = function setRepetitions(repetitions) {
    this.repetitions = repetitions;
};

Tournament.prototype.initialize = function initialize() {
    var i, j, cycle, rep, contestantFiles, contLen, gamesToPlay;
    rep = this.repetitions;
    contestantFiles = this.contestantFiles;
    contLen = contestantFiles.length;
    gamesToPlay = [];

    if (!this.duel) {
        for (i = 0; i < rep; ++i) {
            gamesToPlay.push(contestantFiles);
        }

    } else {

        cycle = [];
        for (i = 0; i < contLen; ++i) {
            for(j = i + 1; j < contLen; ++j) {
                cycle.push([contestantFiles[i], contestantFiles[j]]);
            }
        }

        for (i = 0; i < rep; ++i) {
            gamesToPlay.push.apply(gamesToPlay, cycle);
        }
    }

    this.gamesToPlay = gamesToPlay;
    this.gameIndex = 0;
    this.overview.initialize(this.duel, 0, this.gamesToPlay.length);
};

Tournament.prototype.initializePoints = function initializePoints(activePlayers) {
    var i, contestantKey, player, contestants;
    contestants = this.contestants;

    if (typeof contestants === "undefined") {
        contestants = {};
    }

    for (i = 0; player = activePlayers[i]; ++i) {
        contestantKey = player.name;

        if (!contestants.hasOwnProperty(contestantKey)) {
            contestants[contestantKey] = {
                "name": player.name,
                "color": player.color,
                "points": 0
            };
        }
    }

    this.contestants = contestants;
    this.overview.initialize(this.duel, this.gameIndex, this.gamesToPlay.length, contestants);
};

Tournament.prototype.addResultSummary = function addResultSummary(resultSummary) {
    var i, winnerKey, survivor, players;
    players = resultSummary.players;

    if (players.length == 1) {
        winnerKey = players[0].name;
        this.addPoints(winnerKey, 2);

    } else {

        for (i = 0; survivor = players[i]; ++i) {
            this.addPoints(survivor.name, 1);
        }
    }
    this.gameIndex += 1;
    this.overview.updatePlayerEntries(this.contestants);
    this.overview.setIndex(this.gameIndex);
    if (this.gameIndex >= this.gamesToPlay.length) this.contestants = {};
};

Tournament.prototype.addPoints = function addPoints(playerKey, points) {
    var contestants, contestant;
    contestants = this.contestants;
    if (!contestants.hasOwnProperty(playerKey)) return;

    contestant = contestants[playerKey];
    contestant.points += points;
};

Tournament.prototype.getNextPlayers = function getNextPlayers() {
    return this.gamesToPlay[this.gameIndex];
};
