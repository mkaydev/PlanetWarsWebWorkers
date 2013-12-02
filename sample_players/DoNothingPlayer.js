DoNothingPlayer: function DoNothingPlayer() {
    this.color = [255, 255, 0]; //yellow
    this.initialize();
};
DoNothingPlayer.prototype = new Player();
DoNothingPlayer.prototype.constructor = DoNothingPlayer;
DoNothingPlayer.prototype.think = function think() {};

var _constructor = DoNothingPlayer;