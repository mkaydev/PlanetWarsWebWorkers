var _STATE_KEYS,
    createId;

_STATE_KEYS = function() {
    var i, key, keys, abc, abcLen, values, valueLen;

    keys = {};
    abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    abcLen = abc.length;

    values = [
        "planets",
        "players",
        "fleets",
        "id",
        "forces",
        "airForces",
        "groundForces",
        "x",
        "y",
        "name",
        "color",
        "recruitingPerStep",
        "owner",
        "isNeutral",
        "destination",
        "source",
        "movementPerStep",
        "fleetMovementPerStep",
        "width",
        "height",
        "activePlayersCount",
        "radius",
        "backRightX",
        "backRightY",
        "backLeftX",
        "backLeftY",
        "sourceId",
        "destinationId",
        "ownerId",
        "universe",
        "attackedBy",
        "defendedBy"
    ];

    valueLen = values.length;

    for (i = 0; i < valueLen; ++i) {
        if (i >= abcLen) {
            key = "" + (i - abcLen);
        } else {
            key = abc[i];
        }
        keys[values[i]] = key;
    }
    return keys;
} ();

if (typeof console === "undefined") {
    // used in a worker
    console = {
        "loggedCount": 0,
        "log": function(message) {postMessage({"action": "log", "message": message, "messageId": this.loggedCount++});}
    };
}

if (typeof window === "undefined") {
    // used in a worker
    window = {
        "alertCount": 0,
        "alert": function(message) {postMessage({"action": "alert", "message": message, "messageId": this.alertCount++});}
    };
}

createId = function() {
    var createId, localNext;
    localNext = 0;

    createId = function() {
        return "" + localNext++;
    };
    return createId;
} ();

function shuffleArray(arr) {
    var i, switchIndex, tmp, arrLen;
    arrLen = arr.length;

    for (i = 0; i < arrLen - 1; ++i) {
        switchIndex = Math.floor(Math.random() * (arrLen - i)) + i;
        tmp = arr[i];
        arr[i] = arr[switchIndex];
        arr[switchIndex] = tmp;
    }
}

function checkUnique(arr, attr, inner_attr) {
    var i, attribute, arrLen, known, attrs;
    arrLen = arr.length;
    known = {};
    attrs = [];

    for (i = 0; i < arrLen; ++i) {
        attribute = arr[i][attr];
        if (typeof inner_attr !== "undefined") attribute = attribute[inner_attr];
        if (known.hasOwnProperty(attribute) && known[attribute]) return false;
        attrs.push(attribute);
        known[attribute] = true;
    }
    return true;
}

function shallowCopy(obj) {
    var key, copy;
    copy = {};

    for (key in obj) {
        copy[key] = obj[key];
    }
    return copy;
}