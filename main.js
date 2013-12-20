// responsible for running multiple games (tournaments), visualizing the results and getting user input

$(document).ready(function() {
    new PlanetWarsSimulator(simulatorInitializedCallback);
});

function simulatorInitializedCallback(simulator) {
    var backgroundCanvasId,
        foregroundCanvasId,
        textCanvasId,
        gameStatsDivId,
        contestantsSelectorDivId,
        width,
        height,
        planetCount,
        tournamentOverviewDivId,
        useWebGL,
        tournamentInput,
        tournament,
        runTournSel,
        game,
        gameStats,
        contestantsSelector,
        tournamentOverview,
        gameEnded,
        selectionChanged,
        restartGame,
        players;

    backgroundCanvasId = "gameBackground";
    foregroundCanvasId = "gameForeground";
    textCanvasId = "gameText";
    gameStatsDivId = "gameStats";
    tournamentOverviewDivId = "tournamentOverview";
    contestantsSelectorDivId = "contestantsSelection";

    width = Math.min(screen.width, 1024);
    height = Math.min(screen.height - 200, 600);
    planetCount = 150;
    useWebGL = true;

    players = simulator.players;

    enableInput();
    runTournSel = $("#runTournament");
    runTournSel.prop('checked', false);

    $("#step").attr("disabled", false);

    gameStats = new GameStats(gameStatsDivId);
    tournamentOverview = new TournamentOverview(tournamentOverviewDivId);

    tournamentInput = getTournamentInput();
    tournament = new Tournament(players, tournamentInput.duel, tournamentInput.repetitions, tournamentOverview);
    tournament.initialize();

     game = new PlanetWarsGame(
         planetCount,
         width,
         height,
         backgroundCanvasId,
         foregroundCanvasId,
         textCanvasId,
         gameStats,
         useWebGL,
         simulator
     );

     game.initialize(tournament.getNextPlayerIds());

     gameEnded = function gameEnded(gameResults) {
         tournament.addResultSummary(gameResults);

         if (tournament.gameIndex < tournament.gamesToPlay.length) {
         game.terminateGame();
         unbindControls();

         game.initialize(tournament.getNextPlayerIds());

         window.setTimeout(function() {
             game.play.bind(game)(gameEnded);
             bindControls(game, gameEnded, tournament);
             }, 1200);
         }
     }.bind(this);

     bindControls(game, gameEnded, tournament);

     runTournSel.change(function() {
         restartGame();

         if (this.checked) {
         $("#tournamentType").show();
         } else {
         $("#tournamentType").hide();
         }
     });

     $("#duel").change(function() {
         restartGame();
     });

     $("#lastManStanding").change(function() {
         restartGame();
     });

     $("#repetitions").bind("click keyup", function() {
         tournamentInput = getTournamentInput();
         tournament.setRepetitions(tournamentInput.repetitions);
         tournament.initialize();
     });

    restartGame = function restartGame() {
        game.terminateGame();
        unbindControls();
        tournamentInput = getTournamentInput();
        tournament = new Tournament(players, tournamentInput.duel, tournamentInput.repetitions, tournamentOverview);
        tournament.initialize();

        game.initialize(tournament.getNextPlayerIds());
        bindControls(game, gameEnded, tournament);
    };

    selectionChanged = function selectionChanged(selectedIds) {
        players = selectedIds;
        restartGame();
    };

    contestantsSelector = new ContestantsSelector(players, contestantsSelectorDivId, selectionChanged);
}

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
    $("#webGL").off("change");
}

function bindControls(game, endedCallback, tournament) {
    $("#play").click(function() {
        togglePlayPause();
        $("#gameStats").show();
        $("#contestantsSelection").hide();
        game.play.bind(game)(endedCallback.bind(game));
    });
    $("#pause").click(function() {
        togglePlayPause();
        game.pause.bind(game)();
    });
    $("#initialize").click(function() {
        enableInput();
        $("#step").attr("disabled", false);
        $("#play").show();
        $("#pause").hide();
        $("#gameStats").hide();
        $("#contestantsSelection").show();
        tournament.initialize.bind(tournament)();
        game.initialize(tournament.getNextPlayerIds());
    });
    $("#step").click(function() {
        disableInput();
        game.stepGame.bind(game)(endedCallback);
    });
}

function disableInput() {
    var tournSel = $("#tournamentSelection");
    tournSel.find(":input").attr("disabled", true);
    tournSel.hide();
    $("#tournamentOverview").show();
}

function enableInput() {
    var tournSel = $("#tournamentSelection");
    $("#tournamentOverview").hide();

    tournSel.find(":input").removeAttr("disabled");
    tournSel.show();
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