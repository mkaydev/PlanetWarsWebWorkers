DoNothingPlayer: function DoNothingPlayer() {
    this.color = "yellow";
    this.initialize();
};
DoNothingPlayer.prototype = new Player();
DoNothingPlayer.prototype.constructor = DoNothingPlayer;
DoNothingPlayer.prototype.think = new function think() {};

var constructor = DoNothingPlayer;