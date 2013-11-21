// responsible for running multiple games (tournaments), visualizing the results and getting user input
var playerFiles = [
//    "sample_players/DoNothingPlayer.js",
//
//    "sample_players/RandomPlayer.js",
//    "sample_players/AttackRandomPlayer.js",
//    "sample_players/AttackLargestEmpirePlayer.js",
//    "sample_players/KamikazePlayer.js",
//    "sample_players/SpiralPlayer.js",
//    "sample_players/AttackBestPlanetPlayer.js",
//    "sample_players/SupportNetworkPlayer.js",

    "battle_school/SalamanderPlayer.js",
    "battle_school/RatPlayer.js",
    "sample_players/VirusPlayer.js",
    "sample_players/AlbatrossPlayer.js",
    "sample_players/AttackNearestEnemyPlayer.js",
];

$(document).ready(function() {
    var tournamentInput,
        tournament,
        game,
        initializedCallback,
        gameEnded,
        backgroundCanvasId,
        foregroundCanvasId,
        textCanvasId,
        gameStatsDivId,
        gameStats,
        width,
        height,
        planetCount,
        runTournSel;

    backgroundCanvasId = "gameBackground";
    foregroundCanvasId = "gameForeground";
    textCanvasId = "gameText";
    gameStatsDivId = "gameStats";
    width = 800;
    height = 600;
    planetCount = 150;
    runTournSel = $("#runTournament");

    runTournSel.prop('checked', false);
    $("#tournament").find(":input").removeAttr("disabled");
    $("#step").attr("disabled", false);

    gameStats = new GameStats(gameStatsDivId);

    tournamentInput = getTournamentInput();
    tournament = new Tournament(playerFiles, tournamentInput.duel, tournamentInput.repetitions);
    tournament.initialize();

    initializedCallback = tournament.initializePoints;

    game = new PlanetWarsGame(
        planetCount,
        width,
        height,
        backgroundCanvasId,
        foregroundCanvasId,
        textCanvasId,
        gameStats
    );

    game.initialize(tournament.getNextPlayers(), initializedCallback.bind(tournament));

    gameEnded = function gameEnded(gameResults) {
        tournament.addResultSummary(gameResults);

        if (tournament.gameIndex < tournament.gamesToPlay.length) {
            game.terminateGame();
            unbindControls();

            game.initialize(tournament.getNextPlayers(), initializedCallback.bind(tournament));

            window.setTimeout(function() {
                game.play.bind(game)(gameEnded);
                bindControls(game, gameEnded, tournament, initializedCallback.bind(tournament));
            }, 1200);
        }
    }.bind(this);

    bindControls(game, gameEnded, tournament, initializedCallback.bind(tournament));

    runTournSel.change(function() {
        game.terminateGame();
        unbindControls();
        tournamentInput = getTournamentInput();
        tournament = new Tournament(playerFiles, tournamentInput.duel, tournamentInput.repetitions);
        tournament.initialize();

        game.initialize(tournament.getNextPlayers(), initializedCallback.bind(tournament));
        bindControls(game, gameEnded, tournament, initializedCallback.bind(tournament));

        if (this.checked) {
            $("#tournamentSelection").show();
        } else {
            $("#tournamentSelection").hide();
        }
    });

    $("#duel").change(function() {
        game.terminateGame();
        unbindControls();
        tournamentInput = getTournamentInput();
        tournament = new Tournament(playerFiles, tournamentInput.duel, tournamentInput.repetitions);
        tournament.initialize();

        game.initialize(tournament.getNextPlayers(), initializedCallback.bind(tournament));
        bindControls(game, gameEnded, tournament, initializedCallback.bind(tournament));
    });

    $("#lastManStanding").change(function() {
        game.terminateGame();
        unbindControls();
        tournamentInput = getTournamentInput();
        tournament = new Tournament(playerFiles, tournamentInput.duel, tournamentInput.repetitions);
        tournament.initialize();

        game.initialize(tournament.getNextPlayers(), initializedCallback.bind(tournament));
        bindControls(game, gameEnded, tournament, initializedCallback.bind(tournament));
    });

    $("#repetitions").bind("click keyup", function() {
        tournamentInput = getTournamentInput();
        tournament.setRepetitions(tournamentInput.repetitions);
        tournament.initialize();
    });
});

function getTournamentInput() {
    var repetitions, duel, runTournament;
    repetitions = 1;
    duel = false;
    runTournament = $("#runTournament").is(":checked");

    if (runTournament) {
        repetitions = $("#repetitions").val();
        if (typeof repetitions === "undefined") repetitions = 1;

        repetitions = Math.floor(repetitions);
        if (repetitions < 1) repetitions = 1;

        duel = $("#duel").is(":checked");
    }
    return {"repetitions": repetitions, "duel": duel};
}

function unbindControls() {
    $("#play").off("click");
    $("#pause").off("click");
    $("#initialize").off("click");
    $("#step").off("click");
}

function bindControls(game, endedCallback, tournament, initializedCallback) {
    $("#play").click(function() {
        togglePlayPause();
        game.play.bind(game)(endedCallback.bind(game));
    });
    $("#pause").click(function() {
        togglePlayPause();
        game.pause.bind(game)();
    });
    $("#initialize").click(function() {
        $("#tournament").find(":input").removeAttr("disabled");
        $("#step").attr("disabled", false);
        $("#play").show();
        $("#pause").hide();
        tournament.initialize.bind(tournament)();
        game.initialize(tournament.getNextPlayers(), initializedCallback.bind(tournament));
    });
    $("#step").click(function() {
        disableInput();
        game.stepGame.bind(game)(endedCallback);
    });
}

function disableInput() {
    $("#tournament").find(":input").attr("disabled", true);
}

function togglePlayPause() {
    var playSel, pauseSel, stepSel;
    disableInput();
    playSel = $("#play");
    pauseSel = $("#pause");
    stepSel = $("#step");

    if (playSel.is(":hidden")) {
        playSel.show();
        pauseSel.hide();
        stepSel.attr("disabled", false);
    } else {
        pauseSel.show();
        playSel.hide();
        stepSel.attr("disabled", true);
    }
}