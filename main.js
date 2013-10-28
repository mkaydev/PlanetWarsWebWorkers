// responsible for running multiple games (tournaments), visualizing the results and getting user input
$(document).ready(function() {
    $("#tournament :input").prop('checked', false);
    $("#tournament :input").removeAttr("disabled");

    var backgroundCanvasId = "game_background";
    var foregroundCanvasId = "game_foreground";
    var textCanvasId = "game_text";

    var width = 800;
    var height = 600;
    var planetCount = 150;

    var game = new PlanetWarsGame(planetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId);

    $("#play").click(function() {
        togglePlayPause();
        game.play.bind(game)(gameEnded);
    });
    $("#pause").click(function() {
        togglePlayPause();
        game.pause.bind(game)();
    });
    $("#initialize").click(function() {
        $("#tournament :input").removeAttr("disabled");
        $("#play").show();
        $("#pause").hide();
        game.initialize.bind(game)();
    });
    $("#step").click(game.step.bind(game));

    $("#runTournament").change(function() {
        if (this.checked) {
            $("#tournamentSelection").show();
        } else {
            $("#tournamentSelection").hide();
        }
    });
});

togglePlayPause: function togglePlayPause() {
    $("#tournament :input").attr("disabled", true);
    var playSel = $("#play");
    var pauseSel = $("#pause");

    if (playSel.is(":hidden")) {
        playSel.show();
        pauseSel.hide();
    } else {
        pauseSel.show();
        playSel.hide();
    }
};

gameEnded: function gameEnded(resultSummary) {
    var result = resultSummary.result;
    var players = resultSummary.players;
    if (result === "win") {
        alert(players[0].name + " won!");
    } else {
        var str = "Surviving players: ";
        for (var i = 0; i < players.length; i++) {
            var player = players[i];
            str += player.name;
            if (i < players.length - 1) str += ", ";
        }
        alert("Draw!\n" + str);
    }
};

