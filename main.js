//TODO move id creation into PlanetWarsGame

$(document).ready(function() {
    var backgroundCanvasId = "game_background";
    var foregroundCanvasId = "game_foreground";
    var textCanvasId = "game_text";

    var width = 800;
    var height = 600;
    var planetCount = 150;

    var game = new PlanetWarsGame(planetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId);

    $("#play").click(function() {
        togglePlayPause();
        game.play.bind(game)();
    });
    $("#pause").click(function() {
        togglePlayPause();
        game.pause.bind(game)();
    });
    $("#initialize").click(function() {
        $("#play").show();
        $("#pause").hide();
        game.initialize.bind(game)();
    });
    $("#step").click(game.step.bind(game));

});

togglePlayPause: function togglePlayPause() {
    var playSel = $("#play");
    var pauseSel = $("#pause");

    if (playSel.is(":hidden")) {
        playSel.show();
        pauseSel.hide();
    } else {
        pauseSel.show();
        playSel.hide();
    }
}