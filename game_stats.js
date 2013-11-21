
function GameStats(divId) {
    this.domRepresentation = document.getElementById(divId);
}

GameStats.prototype.playerStatsClass = "gamePlayerStats";
GameStats.prototype.colorCellClass = "statsPlayerColor";
GameStats.prototype.nameCellClass = "statsPlayerName";
GameStats.prototype.forcesCellClass = "statsPlayerForces";

GameStats.prototype.createPlayerEntry = function createPlayerEntry(playerJSON) {
    var forcesDiv,
        colorDiv,
        nameDiv,
        playerEntry;

    forcesDiv = document.createElement("div");
    forcesDiv.className = this.forcesCellClass;
    forcesDiv.innerHTML = playerJSON.forces;

    colorDiv = document.createElement("div");
    colorDiv.className = this.colorCellClass;
    colorDiv.style.cssText = "background-color: " + playerJSON.color + ";";

    nameDiv = document.createElement("div");
    nameDiv.className = this.nameCellClass;
    nameDiv.innerHTML = playerJSON.name;

    playerEntry = document.createElement("div");
    playerEntry.appendChild(colorDiv);
    playerEntry.appendChild(nameDiv);
    playerEntry.appendChild(forcesDiv);
    playerEntry.className = this.playerStatsClass;

    return playerEntry;
};

GameStats.prototype.setPlayerEntries = function setPlayerEntries(playersJSON) {
    var i, playerId, playerJSON, entry;

    this.playerEntries = {};
    this.domRepresentation.innerHTML = "";

    for (i = 0; playerJSON = playersJSON[i]; ++i) {
        playerId = playerJSON.id;
        entry = this.createPlayerEntry(playerJSON);
        this.playerEntries[playerId] = entry;
        this.domRepresentation.appendChild(entry);
    }
};

GameStats.prototype.updatePlayerEntries = function updatePlayerEntries(playersJSON) {
    var i,
        playerId,
        playerJSON,
        entry,
        playerEntries,
        newForces,
        forcesDiv,
        cellClass,
        newForces,
        playerIds;

    cellClass = this.forcesCellClass;
    playerEntries = this.playerEntries;

    playerIds = Object.keys(playerEntries);
    newForces = {};
    for (i = 0; playerId = playerIds[i]; ++i) {
        newForces[playerId] = 0;
    }

    for (i = 0; playerJSON = playersJSON[i]; ++i) {
        playerId = playerJSON.id;
        newForces[playerId] = playerJSON.forces;
    }

    for (i = 0; playerId = playerIds[i]; ++i) {
        entry = playerEntries[playerId];

        forcesDiv = entry.getElementsByClassName(cellClass)[0];
        forcesDiv.innerHTML = newForces[playerId];
    }
};
