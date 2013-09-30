$(document).ready(function() {
    var canvasId = "game";
    var width = 800;
    var height = 600;
    var neutralPlanetCount = 30;

    var players = [new RandomPlayer(), new DoNothingPlayer(), new AttackRandomPlayer(), new AttackLargestEmpirePlayer(), new AttackNearestEnemyPlayer()];

    var game = new PlanetWarsGame(players, neutralPlanetCount, width, height, canvasId);

    // bind controls
    $("#play").click(game.play.bind(game));

});