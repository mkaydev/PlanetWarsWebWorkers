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