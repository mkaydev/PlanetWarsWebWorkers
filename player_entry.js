function PlayerEntry(playerJSON, valueKey) {
    this.name = playerJSON.name;
    this.id = playerJSON.id;
    this.color = playerJSON.color;
    this.value = playerJSON[valueKey];

    this.domRepresentation = this.createDomRepresentation();
};

PlayerEntry.prototype.playerStatsClass = "playerStats";
PlayerEntry.prototype.colorCellClass = "statsPlayerColor";
PlayerEntry.prototype.nameCellClass = "statsPlayerName";
PlayerEntry.prototype.valueCellClass = "statsPlayerValue";

PlayerEntry.prototype.createDomRepresentation = function createDomRepresentation() {
    var valueDiv,
        colorDiv,
        nameDiv,
        playerEntry;

    valueDiv = document.createElement("div");
    valueDiv.className = this.valueCellClass;
    valueDiv.innerHTML = this.value;

    colorDiv = document.createElement("div");
    colorDiv.className = this.colorCellClass;
    colorDiv.style.cssText = "background-color: " + getColorCSS(this.color) + ";";

    nameDiv = document.createElement("div");
    nameDiv.className = this.nameCellClass;
    nameDiv.innerHTML = this.name;

    playerEntry = document.createElement("div");
    playerEntry.appendChild(colorDiv);
    playerEntry.appendChild(nameDiv);
    playerEntry.appendChild(valueDiv);
    playerEntry.className = this.playerStatsClass;

    return playerEntry;
};

PlayerEntry.prototype.updateValue = function updateValue(newValue) {
    var valueDiv;
    if (newValue == this.value) return;
    this.value = newValue;
    valueDiv = this.domRepresentation.getElementsByClassName(this.valueCellClass)[0];
    valueDiv.innerHTML = newValue;
};

