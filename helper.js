_STATE_KEYS = function() {
    var abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var values = [
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
        "universe"
    ];

    var keys = {};
    for (var i = 0; i < values.length; i++) {
        var key;
        if (i >= abc.length) {
            key = "" + (i - abc.length);
        } else {
            key = abc[i];
        }
        keys[values[i]] = key;
    }
    return keys;
} ();

if (typeof console === "undefined") {
    // used in a worker
    var console = {
        "loggedCount": 0,
        "log": function(message) {postMessage({"action": "log", "message": message, "messageId": this.loggedCount++});}
    };
}

if (typeof window === "undefined") {
    // used in a worker
    var window = {
        "alertCount": 0,
        "alert": function(message) {postMessage({"action": "alert", "message": message, "messageId": this.alertCount++});}
    };
}

var createId = function() {
    var localNext = 0;
    var createId = function() {
        return "" + localNext++;
    };
    return createId;
} ();

shuffleArray: function shuffleArray(arr) {
    for (var i = 0; i < arr.length - 1; i++) {
        var switchIndex = Math.floor(Math.random() * arr.length);
        var tmp = arr[i];
        arr[i] = arr[switchIndex];
        arr[switchIndex] = tmp;
    }
};

checkUnique: function checkUnique(arr, attr, inner_attr) {
    var known = {};
    var attrs = [];

    for (var i = 0; i < arr.length; i++) {
        var attribute = arr[i][attr];
        if (typeof inner_attr !== "undefined") attribute = attribute[inner_attr];
        if (known.hasOwnProperty(attribute) && known[attribute]) return false;
        attrs.push(attribute);
        known[attribute] = true;
    }
    return true;
};