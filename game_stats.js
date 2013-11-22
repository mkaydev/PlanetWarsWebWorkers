function PlayerEntry(playerJSON) {
    this.name = playerJSON.name;
    this.id = playerJSON.id;
    this.color = playerJSON.color;
    this.forces = playerJSON.forces;

    this.domRepresentation = this.createDomRepresentation();
};

PlayerEntry.prototype.playerStatsClass = "gamePlayerStats";
PlayerEntry.prototype.colorCellClass = "statsPlayerColor";
PlayerEntry.prototype.nameCellClass = "statsPlayerName";
PlayerEntry.prototype.forcesCellClass = "statsPlayerForces";

PlayerEntry.prototype.createDomRepresentation = function createDomRepresentation() {
    var forcesDiv,
        colorDiv,
        nameDiv,
        playerEntry;

    forcesDiv = document.createElement("div");
    forcesDiv.className = this.forcesCellClass;
    forcesDiv.innerHTML = this.forces;

    colorDiv = document.createElement("div");
    colorDiv.className = this.colorCellClass;
    colorDiv.style.cssText = "background-color: " + this.color + ";";

    nameDiv = document.createElement("div");
    nameDiv.className = this.nameCellClass;
    nameDiv.innerHTML = this.name;

    playerEntry = document.createElement("div");
    playerEntry.appendChild(colorDiv);
    playerEntry.appendChild(nameDiv);
    playerEntry.appendChild(forcesDiv);
    playerEntry.className = this.playerStatsClass;

    return playerEntry;
};

PlayerEntry.prototype.updateForces = function updateForces(newForces) {
    var forcesDiv;
    if (newForces == this.forces) return;
    this.forces = newForces;
    forcesDiv = this.domRepresentation.getElementsByClassName(this.forcesCellClass)[0];
    forcesDiv.innerHTML = newForces;
};


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
        entry = new PlayerEntry(playerJSON);
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
    if (a.forces != b.forces) {
        return b.forces - a.forces;
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
        playerEntry.updateForces(newForces);
    }

    this.refreshDom();
};
