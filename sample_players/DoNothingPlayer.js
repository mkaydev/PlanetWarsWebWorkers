DoNothingPlayer: function DoNothingPlayer() {};
DoNothingPlayer.prototype = new Player();
DoNothingPlayer.prototype.constructor = DoNothingPlayer;
DoNothingPlayer.prototype.think = function think() {};

var _constructor = DoNothingPlayer;