function ContestantRegistry() {
    this.contestants = {};
};

ContestantRegistry.prototype.registerPlayer = function registerPlayer(name, color, filepath) {
    var id = createId();
    this.contestants[id] = {
        "name": name,
        "color": color,
        "file": filepath,
        "id": id
    };
};

ContestantRegistry.prototype.getContestantMetaData = function getContestantMetaData(contestantId) {
    return this.contestants[contestantId];
};

var _contestantRegistry = new ContestantRegistry();

_contestantRegistry.registerPlayer(
    "Chimera",
    [218, 165, 32], //Goldenrod
    "battle_school/ChimeraPlayer.js"
);

_contestantRegistry.registerPlayer(
    "Asp",
    [139, 69, 19], //SaddleBrown
    "battle_school/AspPlayer.js"
);

_contestantRegistry.registerPlayer(
    "Scorpion",
    [220, 20, 60], //Crimson
    "battle_school/ScorpionPlayer.js"
);

_contestantRegistry.registerPlayer(
    "Badger",
    [222, 184, 135], //BurlyWood
    "battle_school/BadgerPlayer.js"
);

_contestantRegistry.registerPlayer(
    "Salamander",
    [143, 188, 143], //DarkSeaGreen
    "battle_school/SalamanderPlayer.js"
);

_contestantRegistry.registerPlayer(
    "Rat",
    [176, 196, 222], //LightSteelBlue
    "battle_school/RatPlayer.js"
);

_contestantRegistry.registerPlayer(
    "AttackNearestEnemy",
    [255, 185, 0], //orange
    "sample_players/AttackNearestEnemyPlayer.js"
);

_contestantRegistry.registerPlayer(
    "Albatross",
    [128, 0, 128], //purple
    "sample_players/AlbatrossPlayer.js"
);

_contestantRegistry.registerPlayer(
    "Virus",
    [128, 128, 0], //olive
    "sample_players/VirusPlayer.js"
);

_contestantRegistry.registerPlayer(
    "SupportNetwork",
    [0, 255, 255], //aqua
    "sample_players/SupportNetworkPlayer.js"
);

_contestantRegistry.registerPlayer(
    "DoNothing",
    [255, 255, 0], //yellow
    "sample_players/DoNothingPlayer.js"
);

_contestantRegistry.registerPlayer(
    "Random",
    [255, 0, 0], //red
    "sample_players/RandomPlayer.js"
);

_contestantRegistry.registerPlayer(
    "AttackRandom",
    [0, 0, 255], //blue
    "sample_players/AttackRandomPlayer.js"
);

_contestantRegistry.registerPlayer(
    "AttackLargestEmpire",
    [0, 128, 0], //green
    "sample_players/AttackLargestEmpirePlayer.js"
);

_contestantRegistry.registerPlayer(
    "Kamikaze",
    [250, 128, 114], //salmon
    "sample_players/KamikazePlayer.js"
);

_contestantRegistry.registerPlayer(
    "Spiral",
    [210, 105, 30], //chocolate
    "sample_players/SpiralPlayer.js"
);

_contestantRegistry.registerPlayer(
    "AttackBestPlanet"
    [250, 235, 215], //AntiqueWhite
    "sample_players/AttackBestPlanetPlayer.js"
);


