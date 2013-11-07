DoNothingPlayer: function DoNothingPlayer() {
    this.color = "yellow";
    this.initialize();
};
DoNothingPlayer.prototype = new Player();
DoNothingPlayer.prototype.constructor = DoNothingPlayer;
DoNothingPlayer.prototype.think = function think() {};

var _constructor = DoNothingPlayer;