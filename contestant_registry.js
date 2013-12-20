function ContestantRegistry() {
    this.contestants = {};
};

ContestantRegistry.prototype.registerPlayer = function registerPlayer(name, color, filepath, selectedByDefault) {
    var id, selected;
    id = createId();
    if (selectedByDefault) {
        selected = true;
    } else {
        selected = false;
    }

    this.contestants[id] = {
        "name": name,
        "color": color,
        "file": filepath,
        "id": id,
        "selected": selected
    };
};

ContestantRegistry.prototype.getContestantMetaData = function getContestantMetaData(contestantId) {
    return this.contestants[contestantId];
};

ContestantRegistry.prototype.getContestantsMetaData = function getContestantsMetaData() {
    return this.contestants;
};

var contestantRegistry = new ContestantRegistry();

contestantRegistry.registerPlayer(
    "Chimera",
    [0, 128, 128], //Teal
    "battle_school/ChimeraPlayer.js",
    true
);

contestantRegistry.registerPlayer(
    "Asp",
    [139, 69, 19], //SaddleBrown
    "battle_school/AspPlayer.js",
    true
);

contestantRegistry.registerPlayer(
    "Scorpion",
    [220, 20, 60], //Crimson
    "battle_school/ScorpionPlayer.js",
    true
);

contestantRegistry.registerPlayer(
    "Badger",
    [222, 184, 135], //BurlyWood
    "battle_school/BadgerPlayer.js",
    true
);

contestantRegistry.registerPlayer(
    "Salamander",
    [143, 188, 143], //DarkSeaGreen
    "battle_school/SalamanderPlayer.js",
    true
);

contestantRegistry.registerPlayer(
    "Rat",
    [176, 196, 222], //LightSteelBlue
    "battle_school/RatPlayer.js",
    true
);

contestantRegistry.registerPlayer(
    "AttackNearestEnemy",
    [255, 185, 0], //orange
    "sample_players/AttackNearestEnemyPlayer.js"
);

contestantRegistry.registerPlayer(
    "Albatross",
    [128, 0, 128], //purple
    "sample_players/AlbatrossPlayer.js"
);

contestantRegistry.registerPlayer(
    "Virus",
    [128, 128, 0], //olive
    "sample_players/VirusPlayer.js"
);

contestantRegistry.registerPlayer(
    "SupportNetwork",
    [0, 255, 255], //aqua
    "sample_players/SupportNetworkPlayer.js"
);

contestantRegistry.registerPlayer(
    "DoNothing",
    [255, 255, 0], //yellow
    "sample_players/DoNothingPlayer.js"
);

contestantRegistry.registerPlayer(
    "Random",
    [255, 0, 0], //red
    "sample_players/RandomPlayer.js"
);

contestantRegistry.registerPlayer(
    "AttackRandom",
    [0, 0, 255], //blue
    "sample_players/AttackRandomPlayer.js"
);

contestantRegistry.registerPlayer(
    "AttackLargestEmpire",
    [0, 128, 0], //green
    "sample_players/AttackLargestEmpirePlayer.js"
);

contestantRegistry.registerPlayer(
    "Kamikaze",
    [250, 128, 114], //salmon
    "sample_players/KamikazePlayer.js"
);

contestantRegistry.registerPlayer(
    "Spiral",
    [210, 105, 30], //chocolate
    "sample_players/SpiralPlayer.js"
);

contestantRegistry.registerPlayer(
    "AttackBestPlanet",
    [250, 235, 215], //AntiqueWhite
    "sample_players/AttackBestPlanetPlayer.js"
);


