function TournamentOverview(overviewDivId) {
    var overviewRepr = document.getElementById(overviewDivId);
    this.indexRepr = overviewRepr.getElementsByClassName(this.indexClass)[0];
    this.countRepr = overviewRepr.getElementsByClassName(this.countClass)[0];
    this.statsRepr = overviewRepr.getElementsByClassName(this.statsClass)[0];
    this.typeRepr = overviewRepr.getElementsByClassName(this.typeClass)[0];
}

TournamentOverview.prototype.playerStatsClass = "playerStats";
TournamentOverview.prototype.colorCellClass = "statsPlayerColor";
TournamentOverview.prototype.nameCellClass = "statsPlayerName";
TournamentOverview.prototype.valueCellClass = "statsPlayerValue";
TournamentOverview.prototype.indexClass = "tournamentGameIndex";
TournamentOverview.prototype.countClass = "tournamentGameCount";
TournamentOverview.prototype.statsClass = "tournamentStats";
TournamentOverview.prototype.typeClass = "tournamentTypeInfo";

TournamentOverview.prototype.setIndex = function setIndex(newIndex) {
    if (this.index == newIndex) return;
    this.index = newIndex;
    this.indexRepr.innerHTML = newIndex;
};

TournamentOverview.prototype.setCount = function setCount(newCount) {
    if (this.count == newCount) return;
    this.count = newCount;
    this.countRepr.innerHTML = newCount;
};

TournamentOverview.prototype.setType = function setType(isDuel) {
    if (this.type == isDuel) return;
    this.type = isDuel;

    if (isDuel) {
        this.typeRepr.innerHTML = "Duel";
    } else {
        this.typeRepr.innerHTML = "Last Man Standing";
    }
};

TournamentOverview.prototype.setPlayerEntries = function setPlayerEntries(contestants) {
    var playerKey,
        contestant,
        entry;

    this.statsRepr.innerHTML = "";
    this.playerEntries = [];
    this.entryPerPlayer = {};

    for (playerKey in contestants) {
        contestant = contestants[playerKey];
        entry = new PlayerEntry(contestant, "points");
        this.playerEntries.push(entry);
        this.entryPerPlayer[playerKey] = entry;
    }
    this.refreshDom();
};

TournamentOverview.prototype.refreshDom = function refreshDom() {
    var i, entry, entryDom, playerEntries, domRepr;
    playerEntries = this.playerEntries;
    playerEntries.sort(this._sortPlayerEntries);

    domRepr = this.statsRepr;
    domRepr.innerHTML = "";

    for (i = 0; entry = playerEntries[i]; ++i) {
        entryDom = entry.domRepresentation;
        domRepr.appendChild(entryDom);
    }
};

TournamentOverview.prototype._sortPlayerEntries = function _sortPlayerEntries(a, b) {
    if (a.value != b.value) {
        return b.value - a.value;
    } else {
        if (a.name > b.name) return 1;
        if (b.name > a.name) return -1;
        return 0;
    }
};

TournamentOverview.prototype.updatePlayerEntries = function updatePlayerEntries(contestants) {
    var playerKey,
        contestant,
        entry,
        playerEntries,
        entryPerPlayer;

    playerEntries = this.playerEntries;
    entryPerPlayer = this.entryPerPlayer;

    for (playerKey in contestants) {
        contestant = contestants[playerKey];

        if (entryPerPlayer.hasOwnProperty(playerKey)) {
            entry = entryPerPlayer[playerKey];
            entry.updateValue(contestant.points);
        } else {
            entry = new PlayerEntry(contestant, "points");
            entryPerPlayer[playerKey] = entry;
            playerEntries.push(entry);
        }
    }
    this.refreshDom();
};

TournamentOverview.prototype.initialize = function initialize(duel, index, gameCount, contestants) {
    this.setType(duel);
    this.setIndex(index);
    this.setCount(gameCount);
    if (typeof contestants !== "undefined") this.setPlayerEntries(contestants);
};