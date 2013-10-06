//TODO move id creation into PlanetWarsGame

$(document).ready(function() {
    var backgroundCanvasId = "game_background";
    var foregroundCanvasId = "game_foreground"
    var width = 800;
    var height = 600;
    var neutralPlanetCount = 50;

    var players = [
        //new AttackRandomPlayer(),
        //new AttackLargestEmpirePlayer(),
        //new AttackBestPlanetPlayer(), 
        //new DoNothingPlayer(), 
        new AttackNearestEnemyPlayer(),
        new SupportNetworkPlayer(),
        new AlbatrossPlayer()
    ];

    var game = new PlanetWarsGame(players, neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId);

    // bind controls
    $("#play").click(game.play.bind(game));

});