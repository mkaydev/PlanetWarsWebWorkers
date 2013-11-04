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

createId: function createId(prefix) {
    if (typeof prefix === "undefined") prefix = "";
    return "".concat(prefix, Math.random(),  new Date().getTime());
}

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