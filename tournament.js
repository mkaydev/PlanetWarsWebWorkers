function Tournament(contestantsMetaData, duel, repetitions, tournamentOverview) {
    this.repetitions = repetitions;
    this.duel = duel;
    this.contestantsMeta = this.filterUnselected(contestantsMetaData);
    this.contestantsIds = this.getContestantIds(this.contestantsMeta);
    this.overview = tournamentOverview;
}

Tournament.prototype.filterUnselected = function filterUnselected(contestantsMetaData) {
    var id, meta, result;
    result = {};

    for (id in contestantsMetaData) {
        meta = contestantsMetaData[id];
        if (meta.selected) {
            result[id] = meta;
        }
    }
    return result;
};

Tournament.prototype.getContestantIds = function getContestantIds(contestantsMetaData) {
    return Object.keys(contestantsMetaData);
};

Tournament.prototype.setRepetitions = function setRepetitions(repetitions) {
    this.repetitions = repetitions;
};

Tournament.prototype.initialize = function initialize() {
    var i, j, cycle, rep, contestantsIds, contLen, gamesToPlay;
    rep = this.repetitions;
    contestantsIds = this.contestantsIds;
    contLen = contestantsIds.length;
    gamesToPlay = [];

    if (!this.duel) {
        for (i = 0; i < rep; ++i) {
            gamesToPlay.push(contestantsIds);
        }

    } else {

        cycle = [];
        for (i = 0; i < contLen; ++i) {
            for(j = i + 1; j < contLen; ++j) {
                cycle.push([contestantsIds[i], contestantsIds[j]]);
            }
        }

        for (i = 0; i < rep; ++i) {
            gamesToPlay.push.apply(gamesToPlay, cycle);
        }
    }

    this.gamesToPlay = gamesToPlay;
    this.gameIndex = 0;
    this.initializePoints(this.contestantsMeta);
    this.overview.initialize(this.duel, 0, this.gamesToPlay.length);
};

Tournament.prototype.initializePoints = function initializePoints(players) {
    var contestantKey, player, contestants;
    contestants = this.contestants;

    if (typeof contestants === "undefined") {
        contestants = {};
    }

    for (contestantKey in players) {
        player = players[contestantKey];

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
        winnerKey = players[0].id;
        this.addPoints(winnerKey, 2);

    } else {

        for (i = 0; survivor = players[i]; ++i) {
            this.addPoints(survivor.id, 1);
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

Tournament.prototype.getNextPlayerIds = function getNextPlayerIds() {
    return this.gamesToPlay[this.gameIndex];
};
