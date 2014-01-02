ContestantSelector: function ContestantSelector(playerMetaData, onChangeCallback) {
    this.id = playerMetaData.id;
    this.name = playerMetaData.name;
    this.color = playerMetaData.color;

    this.selected = playerMetaData.selected;
    this.domRepresentation = this.createDomRepresentation(onChangeCallback);
};

ContestantSelector.prototype.createDomRepresentation = function createDomRepresentation(onChangeCallback) {
    var valueCheckbox,
        valueDiv,
        colorDiv,
        nameDiv,
        selector;

    valueDiv = document.createElement("div");
    valueDiv.className = this.valueCellClass;
    valueCheckbox = document.createElement("input");
    valueCheckbox.type = "checkbox";
    valueCheckbox.id = this.id;
    valueCheckbox.checked = this.selected;
    valueCheckbox.onchange = function(event) {
        this.selected = event.target.checked;
        onChangeCallback(this.id, this.selected);
    }.bind(this);
    valueDiv.appendChild(valueCheckbox);

    colorDiv = document.createElement("div");
    colorDiv.className = this.colorCellClass;
    colorDiv.style.cssText = "background-color: " + getColorCSS(this.color) + ";";

    nameDiv = document.createElement("div");
    nameDiv.className = this.nameCellClass;
    nameDiv.innerHTML = this.name;

    selector = document.createElement("div");
    selector.appendChild(valueDiv);
    selector.appendChild(colorDiv);
    selector.appendChild(nameDiv);
    selector.className = this.contestantSelectorClass;

    return selector;
};

ContestantSelector.prototype.isSelected = function isSelected() {
    return this.selected;
};


ContestantSelector.prototype.contestantSelectorClass = "contestantSelection";
ContestantSelector.prototype.colorCellClass = "selectionPlayerColor";
ContestantSelector.prototype.nameCellClass = "selectionPlayerName";
ContestantSelector.prototype.valueCellClass = "playerSelected";

//------------------------------
ContestantsSelector: function ContestantsSelector(playersMetaData, divId, selectionChangedCallback) {
    this.playersMetaData = playersMetaData;
    this.selectors = this.createContestantSelectors(playersMetaData, this.updateSelected.bind(this));
    this.selected = this.getSelectedContestantIds();
    this.selectionChangedCallback = selectionChangedCallback;
    this.domRepresentation = document.getElementById(divId);
    this.setupDomRepresentation();
}

ContestantsSelector.prototype.updateSelected = function updateSelected(updateId, isSelected) {
    var id, selected, selectedObj, playersMetaData;

    selected = this.selected;
    selected[updateId] = isSelected;
    playersMetaData = this.playersMetaData;

    selectedObj = {};
    for (id in selected) {
        if (selected[id]) {
            playersMetaData[id].selected = true;
            selectedObj[id] = playersMetaData[id];
        } else {
            playersMetaData[id].selected = false;
        }
    }
    this.selectionChangedCallback(selectedObj);
};

ContestantsSelector.prototype.getSelectedContestantIds = function getSelectedContestantIds() {
    var selectors, id, selector, selected;
    selectors = this.selectors;
    selected = {};

    for (id in selectors) {
        selector = selectors[id];
        selected[id] = selector.isSelected();
    }
    return selected;
};

ContestantsSelector.prototype.setupDomRepresentation = function setupDomRepresentation() {
    var i, selectors, selector, id, domRepresentation, selectorArr;
    selectors = this.selectors;

    selectorArr = [];
    for (id in selectors) {
        selector = selectors[id];
        selectorArr.push(selector);
    }

    selectorArr.sort(this._sortSelectors);

    domRepresentation = this.domRepresentation;
    domRepresentation.innerHTML = "";

    for (i = 0; selector = selectorArr[i]; ++i) {
        domRepresentation.appendChild(selector.domRepresentation);
    }
};

ContestantsSelector.prototype.createContestantSelectors = function createContestantSelectors(playersMetaData, onChangeCallback) {
    var selectors, selector, meta, id;
    selectors = {};

    for (id in playersMetaData) {
        meta = playersMetaData[id];
        selector = new ContestantSelector(meta, onChangeCallback);
        selectors[id] = selector;
    }
    return selectors;
};

ContestantsSelector.prototype._sortSelectors = function _sortSelectors(a, b) {
    if (a.name > b.name) return 1;
    if (b.name > a.name) return -1;
    return 0;
};

