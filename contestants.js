Contestants: function Contestants() {
    var contestantConstructors = [];

    this.register = function register(playerConstructor) {
        contestantConstructors.push(playerConstructor);
    };

    // constructorNames refers to an array of the .name-attributes of the function objects, not the instances, e.g. "DoNothingPlayer"
    this.getInstances = function(constructorNames) {
        var instances = [];
        for (var i = 0; i < constructorNames.length; i++) {
            var constructorName = constructorNames[i];

            for (var j = 0; j < contestantConstructors.length; j++) {
                var constructor = contestantConstructors[j];
                if (constructor.name === constructorName) {
                    instances.push(new constructor());
                }
            }
        }
        shuffleArray(instances);
        return instances;
    };
};

var contestants = new Contestants();
