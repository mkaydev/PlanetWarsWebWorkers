//TODO move id creation into PlanetWarsGame

$(document).ready(function() {
    var backgroundCanvasId = "game_background";
    var foregroundCanvasId = "game_foreground";
    var textCanvasId = "game_text";

    var width = 800;
    var height = 600;
    var neutralPlanetCount = 50;

    var game = new PlanetWarsGame(neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId);

    // bind controls
    $("#play").click(game.play.bind(game));

});