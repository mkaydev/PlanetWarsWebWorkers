[Live demo on the github project page](http://mkaydev.github.io/PlanetWarsWebWorkers/) (Firefox only, because it uses nested web worker creation)

# Discontinued

Will be replaced by a client/server implementation.

# Implement a player:
 - create a constructor for your the player
 - set the .prototype of the new player object to new Player()
 - set the .prototype.constructor to your player constructor
 - implement the .think method for your player
 - set the variable _constructor to the constructor of your player (this variable will be used to create instances of your player)
 - register the player in the contestant_registry.js-file by specifying the meta data for your player (name, color, file path etc.)

Have a look at the sample_players to see examples.

--------------------------------------------------------------------------------------------

# Publicly accessible API for use in the .think method:

## Player

### Methods

Player:sendFleet(source, destination, fleetSize)
    source: a planet, owned by the player
    destination: a planet
    fleetSize: an integer

Player:equals

### Attributes

Player:id

Player:isNeutral


## Planet

### Methods

Planet:isNeutral()

Planet:distanceTo(otherPlanet)

Planet:distanceToCoords(x, y)

Planet:fleetStepsTo(otherPlanet)

Planet:ownerEquals(player)

Planet:getX()

Planet:getY()

Planet:getForces()

Planet:getOwner()

Planet:getRecruitingPerStep()

Planet:getId()

### Attributes

None


## Fleet

### Methods

Fleet:ownerEquals(player)

Fleet:distanceToDestination()

Fleet:stepsToDestination()

Fleet:isHostileTo(fleetOrPlanet)

Fleet:isHostileToDestination()

Fleet:getMovementPerStep()

Fleet:getX()

Fleet:getY()

Fleet:getMovementPerStep()

Fleet:getSource()

Fleet:getDestination()

Fleet:getOwner()

Fleet:getId()


### Attributes

None


## Universe

### Methods

Universe:getActivePlayers()

Universe:getAllPlanets()

Universe:getPlanets(player)

Universe:getNeutralPlanets()

Universe:getEnemyPlanets(player)

Universe:sortByDistance(planet, planets [,reverse])

Universe:sortByRecruitingPower(planets [,reverse])

Universe:sortByForces(planetsOrFleets [,reverse])

Universe:getGroundForces(player)

Universe:getAirForces(player)

Universe:getForces(player)

Universe:getAllFleets()

Universe:getFleets(player)

Universe:getEnemyFleets(player)

Universe:sortByDistanceToDestination(fleets [,reverse])

Universe:sortPlayersByForces(players [,reverse])


### Attributes

Universe:width

Universe:height

Universe:fleetMovementPerStep

## Helper functions


shuffleArray(arr)

checkUnique(arr, attribute [, inner_attribute])

createId([prefix])


# Debugging:

There is no console or window object in a web worker. The helper.js file defines these objects in a way that a message is posted to the creator of the worker.
console.log(message) allows logging to the console (only string or json objects)
window.alert(message) allows creating alert windows (only string or json objects)

If your player manages to freeze your browser, because the .think method takes too long and you're not able to debug the method because of it,
try setting maxRounds value (planet_wars.js) to a lower value. The simulator tries to pre-calculate this number of states in the background.

Be aware that this logging function relies on the asynchronous message passing of the web worker. It seems that the messages don't necessarily arrive in order.
A messageId (count of logs/alerts sent) is being sent together with the message for this reason. The console and window objects keep track of this value.

--------------------------------------------------------------------------------------------
Be warned:
- Don't try to screw with the _ stuff. their scope is limited to this universe slave, i.e. to one player. By screwing with them you only screw your own player.
- Don't try to call the .sendFleet method on other players - it won't work.
- Don't try to send more forces than you have, send fractions of forces, negative forces etc. - won't work.
- Be aware that fleets are only visible to you starting with the step _after_ they have been sent.

--------------------------------------------------------------------------------------------
P.S. The reason that planets and fleets only have methods is to safe memory. On the universe slave side the planets and fleets are mainly wrappers around a json-representation.
The wrappers only provide additional functions, which are shared by all fleet or planet objects (in the prototype).
The json-representation only resides once in memory (as far as I understand), too. The wrapper won't create a local copy.
This is in contrast to storing all the values from the json-representation in attributes.
It is expected that for most if not all of the game: #Players <way lower than< #Planets < #Fleets  (-> it is especially important for fleets, not really for players)


# Sparring partners

Currently implemented players are in the sample_players and battle_school folder.
The current sample players could be separated into classes as follows:

Complete idiots:

DoNothingPlayer, SpiralPlayer, RandomPlayer, AttackRandomPlayer, AttackLargestEnemyPlayer, KamikazePlayer, AttackBestPlanetPlayer
Naive, but alright: SupportNetworkPlayer, AlbatrossPlayer, VirusPlayer, AttackNearestEnemyPlayer

The AttackNearestEnemyPlayer performs the best of the sample players.

The SupportNetworkPlayer performs the worst in a duel of the four. (Will win none against the other three and sometimes fails to finish against the AlbatrossPlayer - even if he has more forces.) He performs reasonably well in a last man standing with a lot of players.

The VirusPlayer performs the worst in a last man standing setting, but will perform as well as the AttackNearestEnemyPlayer in a duel.

The battle_school folder is for players with more sophisticated strategies. The players dominate duel and last man standing tournaments against the sample players.

The idiots are good for early sparring and for last man standing setups, e.g. adding a DoNothingPlayer to a last man standing will act as a kind of honeypot for players,
who don't realize that attacking this player in the early phase of the game is suicide. (One of the differences between the SupportNetworkPlayer and the AlbatrossPlayer.)

## Duel

In a duel the more aggressive players perform a lot better. This includes strategies such as keeping no reserves for planets far away from the enemy in order to conquer neutral planets faster.

The mid-game in a duel is a lot more interesting, because it is easier for an opponent with a better strategy to win while at a disadvantage.

To train against different strategies, the following are a good list:
- Scorpion, Asp, or Chimera
- Badger
- Salamander
- Albatross

## Last man standing

In a duel defensive players seem to perform better on average. Chance plays a much bigger role.

In a duel players that started in a place with few close planets can still stand a chance if their strategy allows them to conquer planets faster. In a last man standing match this is much harder.

A position that is far away from the corners is harder to play. The bigger the number of players the harder it is too win a match where you started from the middle rather than a corner. Because you're sandwiched between enemies and have more surface to defend. That's why Rat and Salamander perform well on average. They always focus on conquering a corner first.

It is rare for a player to win by conquering the (top left + top right) or (lower left + lower right) corner first. A better approach seems to be to conquer the left side or the ride side.

To train against different strategies, the following are a good list:
- Rat and Salamander
- Scorpion, Asp, or Chimera
- Badger
- Albatross and SupportNetworkPlayer
- AttackNearestEnemy
- DoNothing
