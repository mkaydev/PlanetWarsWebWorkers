// responsible for running multiple games (tournaments), visualizing the results and getting user input
var playerFiles = [
  //  "sample_players/DoNothingPlayer.js",

  //  "sample_players/RandomPlayer.js",
  //  "sample_players/AttackRandomPlayer.js",
  //  "sample_players/AttackLargestEmpirePlayer.js",
  //  "sample_players/KamikazePlayer.js",
  //  "sample_players/SpiralPlayer.js",
  //  "sample_players/AttackBestPlanetPlayer.js",
  // "sample_players/SupportNetworkPlayer.js"

    "battle_school/SalamanderPlayer.js",
    "battle_school/RatPlayer.js",
  //  "sample_players/VirusPlayer.js",
  //  "sample_players/AlbatrossPlayer.js",
  //  "sample_players/AttackNearestEnemyPlayer.js",
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
        width,
        height,
        planetCount,
        runTournSel;

    backgroundCanvasId = "game_background";
    foregroundCanvasId = "game_foreground";
    textCanvasId = "game_text";
    width = 800;
    height = 600;
    planetCount = 150;
    runTournSel = $("#runTournament");

    runTournSel.prop('checked', false);
    $("#tournament").find(":input").removeAttr("disabled");
    $("#step").attr("disabled", false);


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
        textCanvasId
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
        game.step.bind(game)(endedCallback);
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

function Tournament(contestants, duel, repetitions) {
    this.repetitions = repetitions;
    this.duel = duel;
    this.contestants = contestants;
}

Tournament.prototype.setRepetitions = function setRepetitions(repetitions) {
    this.repetitions = repetitions;
};

Tournament.prototype.initialize = function initialize() {
    var i, j, cycle, rep, contestants, contLen, gamesToPlay;
    rep = this.repetitions;
    contestants = this.contestants;
    contLen = contestants.length;
    gamesToPlay = [];


    if (!this.duel) {
        for (i = 0; i < rep; ++i) {
            gamesToPlay.push(contestants);
        }

    } else {

        cycle = [];
        for (i = 0; i < contLen; ++i) {
            for(j = i + 1; j < contLen; ++j) {
                cycle.push([contestants[i], contestants[j]]);
            }
        }

        for (i = 0; i < rep; ++i) {
            gamesToPlay.push.apply(gamesToPlay, cycle);
        }
    }

    this.gamesToPlay = gamesToPlay;
    this.gameIndex = 0;
};

Tournament.prototype.initializePoints = function initializePoints(activePlayers) {
    var i, contestant, points, player;
    points = this.points;

    if (typeof points === "undefined") points = {};

    for (i = 0; player = activePlayers[i]; ++i) {
        contestant = player.name;
        if (!points.hasOwnProperty(contestant)) points[contestant] = 0;
    }

    this.points = points;
};

Tournament.prototype.addResultSummary = function addResultSummary(resultSummary) {
    var i, winner, survivor, players, playersLen;
    players = resultSummary.players;
    playersLen = players.length;

    if (playersLen == 1) {
        winner = players[0].name;
        this.addPoints(winner, 2);

    } else {

        for (i = 0; survivor = players[i]; ++i) {
            this.addPoints(survivor.name, 1);
        }
    }
    this.gameIndex += 1;
    console.log(this.points);
    if (this.gameIndex >= this.gamesToPlay.length) this.points = {};
};

Tournament.prototype.addPoints = function addPoints(playerName, points) {
    var curPoints = this.points;

    if (curPoints.hasOwnProperty(playerName)) {
        curPoints[playerName] += points;
    } else {
        curPoints[playerName] = points;
    }
};

Tournament.prototype.getNextPlayers = function getNextPlayers() {
    return this.gamesToPlay[this.gameIndex];
};