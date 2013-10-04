//TODO move id creation into PlanetWarsGame

$(document).ready(function() {
    var backgroundCanvasId = "game_background";
    var foregroundCanvasId = "game_foreground"
    var width = 800;
    var height = 600;
    var neutralPlanetCount = 30;

    var players = [
        new AttackNearestEnemyPlayer(),
        new AttackRandomPlayer(),
        new AttackLargestEmpirePlayer(),
        new KamikazePlayer(),
        new AttackBestPlanetPlayer()
    ];

    var game = new PlanetWarsGame(players, neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId);

    // bind controls
    $("#play").click(game.play.bind(game));

});