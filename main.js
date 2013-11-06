// responsible for running multiple games (tournaments), visualizing the results and getting user input
var playerFiles = [
    "battle_school/RatPlayer.js",
    "sample_players/VirusPlayer.js",
    "sample_players/AlbatrossPlayer.js",
    "sample_players/AttackNearestEnemyPlayer.js",
    "sample_players/SupportNetworkPlayer.js"
];

$(document).ready(function() {
    $("#runTournament").prop('checked', false);
    $("#tournament :input").removeAttr("disabled");

    var backgroundCanvasId = "game_background";
    var foregroundCanvasId = "game_foreground";
    var textCanvasId = "game_text";

    var width = 800;
    var height = 600;
    var planetCount = 150;
    var tournamentInput = getTournamentInput();
    var tournament = new Tournament(playerFiles, tournamentInput.duel, tournamentInput.repetitions);
    tournament.initialize();

    var initializedCallback = tournament.initializePoints;

    var game = new PlanetWarsGame(
        tournament.getNextPlayers(),
        initializedCallback.bind(tournament),
        planetCount,
        width,
        height,
        backgroundCanvasId,
        foregroundCanvasId,
        textCanvasId
    );

    var gameEnded = function gameEnded(gameResults) {
        tournament.addResultSummary(gameResults);

        if (tournament.gameIndex < tournament.gamesToPlay.length) {
            game.terminateGame();
            unbindControls();
            game = new PlanetWarsGame(
                tournament.getNextPlayers(),
                initializedCallback.bind(tournament),
                planetCount,
                width,
                height,
                backgroundCanvasId,
                foregroundCanvasId,
                textCanvasId
            );

            window.setTimeout(function() {
                game.play.bind(game)(gameEnded);
                bindControls(game, gameEnded, tournament, initializedCallback.bind(tournament));
            }, 1000);
        }
    }.bind(this);

    bindControls(game, gameEnded, tournament, initializedCallback.bind(tournament));

    $("#runTournament").change(function() {
        game.terminateGame();
        unbindControls();
        tournamentInput = getTournamentInput();
        tournament = new Tournament(playerFiles, tournamentInput.duel, tournamentInput.repetitions);
        tournament.initialize();

        game = new PlanetWarsGame(
            tournament.getNextPlayers(),
            initializedCallback.bind(tournament),
            planetCount,
            width,
            height,
            backgroundCanvasId,
            foregroundCanvasId,
            textCanvasId
        );
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

        game = new PlanetWarsGame(
            tournament.getNextPlayers(),
            initializedCallback.bind(tournament),
            planetCount,
            width,
            height,
            backgroundCanvasId,
            foregroundCanvasId,
            textCanvasId
        );

        bindControls(game, gameEnded, tournament, initializedCallback.bind(tournament));
    });

    $("#lastManStanding").change(function() {
        game.terminateGame();
        unbindControls();
        tournamentInput = getTournamentInput();
        tournament = new Tournament(playerFiles, tournamentInput.duel, tournamentInput.repetitions);
        tournament.initialize();

        game = new PlanetWarsGame(
            tournament.getNextPlayers(),
            initializedCallback.bind(tournament),
            planetCount,
            width,
            height,
            backgroundCanvasId,
            foregroundCanvasId,
            textCanvasId
        );

        bindControls(game, gameEnded, tournament, initializedCallback.bind(tournament));
    });

    $("#repetitions").bind("click keyup", function() {
        tournamentInput = getTournamentInput();
        tournament.setRepetitions(tournamentInput.repetitions);
        tournament.initialize();
    });
});

getTournamentInput: function getTournamentInput() {
    var runTournament = $("#runTournament").is(":checked");
    var repetitions = 1;
    var duel = false;
    if (runTournament) {
        repetitions = $("#repetitions").val();
        if (typeof repetitions === "undefined") repetitions = 1;
        repetitions = Math.floor(repetitions);
        if (repetitions < 1) repetitions = 1;

        duel = $("#duel").is(":checked");
    }
    return {"repetitions": repetitions, "duel": duel};
};

unbindControls: function unbindControls() {
    $("#play").off("click");
    $("#pause").off("click");
    $("#initialize").off("click");
    $("#step").off("click");
};

bindControls: function bindControls(game, endedCallback, tournament, initializedCallback) {
    $("#play").click(function() {
        togglePlayPause();
        game.play.bind(game)(endedCallback.bind(game));
    });
    $("#pause").click(function() {
        togglePlayPause();
        game.pause.bind(game)();
    });
    $("#initialize").click(function() {
        $("#tournament :input").removeAttr("disabled");
        $("#play").show();
        $("#pause").hide();
        tournament.initialize.bind(tournament)();
        game.initialize.bind(game)(initializedCallback);
    });
    $("#step").click(function() {
        game.step.bind(game)(endedCallback);
    });
};

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

Tournament: function Tournament(contestants, duel, repetitions) {
    this.repetitions = repetitions;
    this.duel = duel;
    this.contestants = contestants;
};

Tournament.prototype.setRepetitions = function setRepetitions(repetitions) {
    this.repetitions = repetitions;
};

Tournament.prototype.initialize = function initialize() {
    this.gameIndex = 0;
    this.gamesToPlay = [];

    if (!this.duel) {
        for (var i = 0; i < this.repetitions; i++) {
            this.gamesToPlay.push(this.contestants);
        }

    } else {

        var cycle = [];
        for (var i = 0; i < this.contestants.length - 1; i++) {
            for(var j = i + 1; j < this.contestants.length; j++) {
                cycle.push([this.contestants[i], this.contestants[j]]);
            }
        }

        for (var i = 0; i < this.repetitions; i++) {
            this.gamesToPlay.push.apply(this.gamesToPlay, cycle);
        }
    }
};

Tournament.prototype.initializePoints = function initializePoints(activePlayers) {
    if (typeof this.points === "undefined") this.points = {};
    for (var i = 0; i < activePlayers.length; i++) {
        var contestant = activePlayers[i].name;
        if (!this.points.hasOwnProperty(contestant)) this.points[contestant] = 0;
    }
};

Tournament.prototype.addResultSummary = function addResultSummary(resultSummary) {
    var players = resultSummary.players;

    if (players.length === 1) {
        var winner = players[0].name;
        this.addPoints(winner, 2);

    } else {

        for (var i = 0; i < players.length; i++) {
            var survivor = players[i].name;
            this.addPoints(survivor, 1);
        }
    }
    this.gameIndex += 1;
    console.log(this.points);
    if (this.gameIndex >= this.gamesToPlay.length) this.points = {};
};

Tournament.prototype.addPoints = function addPoints(playerName, points) {
    if (this.points.hasOwnProperty(playerName)) {
        this.points[playerName] += points;
    } else {
        this.points[playerName] = points;
    }
};

Tournament.prototype.getNextPlayers = function getNextPlayers() {
    return this.gamesToPlay[this.gameIndex];
};