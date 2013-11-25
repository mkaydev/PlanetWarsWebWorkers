function GameStats(divId) {
    this.domRepresentation = document.getElementById(divId);
}

GameStats.prototype.setPlayerEntries = function setPlayerEntries(playersJSON) {
    var i,
        playerId,
        playerJSON,
        entry;

    this.domRepresentation.innerHTML = "";
    this.playerEntries = [];

    for (i = 0; playerJSON = playersJSON[i]; ++i) {
        playerId = playerJSON.id;
        entry = new PlayerEntry(playerJSON, "forces");
        this.playerEntries.push(entry);
    }

    this.refreshDom();
};

GameStats.prototype.refreshDom = function refreshDom() {
    var i, entry, entryDom, playerEntries, domRepr;
    playerEntries = this.playerEntries;
    playerEntries.sort(this._sortPlayerEntries);

    domRepr = this.domRepresentation;
    domRepr.innerHTML = "";

    for (i = 0; entry = playerEntries[i]; ++i) {
        entryDom = entry.domRepresentation;
        domRepr.appendChild(entryDom);
    }
};

GameStats.prototype._sortPlayerEntries = function _sortPlayerEntries(a, b) {
    if (a.value != b.value) {
        return b.value - a.value;
    } else {
        if (a.name > b.name) return 1;
        if (b.name > a.name) return -1;
        return 0;
    }
};

GameStats.prototype.updatePlayerEntries = function updatePlayerEntries(playersJSON) {
    var i,
        playerId,
        playerJSON,
        playerEntry,
        playerEntries,
        newForcesPerPlayer,
        newForces;

    playerEntries = this.playerEntries;
    newForcesPerPlayer = {};

    for (i = 0; playerEntry = playerEntries[i]; ++i) {
        playerId = playerEntry.id;
        newForcesPerPlayer[playerId] = 0;
    }

    for (i = 0; playerJSON = playersJSON[i]; ++i) {
        playerId = playerJSON.id;
        newForcesPerPlayer[playerId] = playerJSON.forces;
    }

    for (i = 0; playerEntry = playerEntries[i]; ++i) {
        playerId = playerEntry.id;
        newForces = newForcesPerPlayer[playerId];
        playerEntry.updateValue(newForces);
    }

    this.refreshDom();
};
