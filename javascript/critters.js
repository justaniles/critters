var AnimationSync = function() {
  this.animations = {};
  this.idCounter = 0;
};
AnimationSync.prototype = {

  registerAnimation: function(func, frequency, context) {
    var id = "id"+this.idCounter;
    this.animations[id]  = {
      "func": func.bind(context),
      "frequency": frequency,
      "counter": frequency
    };
    this.idCounter += 1;
    return id;
  },

  unregisterAnimation: function(id) {
    if (this.animations.hasOwnProperty(id)) {
      delete this.animations[id];
    }
  },

  advance: function(timeDelta) {
    // Iterate over all this.animations, decrementing their counters,
    // and calling their functions if the counters reach 0.
    for (id in this.animations) {
      var curAnim = this.animations[id];
      var newCount = curAnim.counter - timeDelta;
      if (newCount < 0) {
        curAnim.func();
        curAnim.counter = curAnim.frequency; // (b/c newCount < 0)
      }
      else {
        curAnim.counter = newCount;
      }
    }
  }
};
var animationSync = new AnimationSync();

var Status = {
  WANDERING: "wandering",
  RESTING: "resting",
  INVESTIGATING: "investigating",
  FOLLOWING: "following",
  FRIGHTENED: "fightened"
};

var SCREEN_WIDTH = view.viewSize.width;
var SCREEN_HEIGHT = view.viewSize.height;

/**
 * Critter object
 */
function Critter(p, v, s, attribs) {
  this.point = p; // Point object
  this.vector = v; // Point object with angle and direction
  this.size = s; // Size object
  this.dest = Point.random() * new Point(SCREEN_WIDTH, SCREEN_HEIGHT);

  // Initialize this critter's attributes to default and load any user-supplied attributes
  // NOTE: attributes should be set upfront for the critter and NEVER change
  // thereafter (unless I introduce some sort of evolution system...).
  this.attributes = {
    // Curiosity: float [-1, 1]
    // (0, 1]  = curious
    // [-1, 0) = fearful
    // [0]      = indifferent
    curiosity: Math.random() * 2 - 1,
    // Top Speed: float [0, 10]
    topSpeed: 2,
    // Collision radius: float
    collisionRadius: 20
  };
  if (typeof attribs !== 'undefined') {
    for (var prop in this.attributes) {
      if (attribs.hasOwnProperty(prop)) {
        this.attributes[prop] = attribs[prop];
      }
    }
  }

  // Initialize status to wandering
  this.status = Status.WANDERING;
  this.animationId = animationSync.registerAnimation(this.wander, 1, this);
  // Update status periodically
  animationSync.registerAnimation(this.updateStatus, 5, this);

  // The critter's body:
  this.body = new Path.Circle(this.point, this.size.width);
  this.body.style = {
    strokeColor: "black",
    fillColor: "white",
    strokeWidth: 2
  };
  this.eye1 = new Path.Circle(this.point, 6);
  this.eye1.style = {
    strokeColor: "black",
    fillColor: "white",
    strokeWidth: 2
  };
  this.eye2 = new Path.Circle(this.point, 6);
  this.eye2.style = {
    strokeColor: "black",
    fillColor: "white",
    strokeWidth: 2
  };
  this.pupil1 = new Path.Circle(this.point, 3);
  this.pupil1.fillColor = "black";
  this.pupil2 = new Path.Circle(this.point, 3);
  this.pupil2.fillColor = "black";

  // this.vectorPath = new Path();
  // this.vectorPath.add(new Point());
  // this.vectorPath.add(new Point());
  // this.vectorPath.strokeColor = "green";
}
Critter.prototype = {

  /**
   * Call all necessary functions to update this critter on a given frame
   * NOTE: This is the ONLY function that should be called externally
   */
  iterate: function() {
    this.updateVector();
    this.updatePosition();
  },

  wander: function() {
    // Move random and aimlessly by going to a random point on screen
    this.dest = Point.random() * new Point(SCREEN_WIDTH, SCREEN_HEIGHT);
  },

  updateVector: function() {
    var directedVector = this.dest - this.point;

    // Check if this critter is resting, if so decelerate
    if (this.status === Status.RESTING) {
      var slowed = this.vector.length *= 0.9;
      this.vector.length = (slowed > 0.01 ? slowed : 0);
    }
    // Otherwise, pursue dest
    else {
      // If we're inside collisionRadius, decelerate inversely proportional
      // to distance from dest
      if (directedVector.length <= this.attributes.collisionRadius) {
        // Check if we've arrived at dest
        if (directedVector.length < 1) {
          this.vector.length = 0;
        }
        // Otherwise, decelerate
        else {
          this.vector.length = this.attributes.topSpeed
           * (directedVector.length / this.attributes.collisionRadius);
        }
      }
      // Outside collisionRadius, accelerate towards dest
      else {
        this.vector.length += this.attributes.topSpeed / 10;
      }
    }
    this.vector.length = Math.min(this.vector.length, this.attributes.topSpeed);
    this.vector.angle += this.vector.getDirectedAngle(directedVector)
      / (15 - this.attributes.topSpeed);
  },

  /**
   * Update critter's point solely based upon its vector, then update the
   * body's position to correspond to the point value.
   */
  updatePosition: function() {
    this.point += this.vector;
    // Wrap is critter goes off screen
    if (this.point.x < -this.size.width) {
      this.point.x = view.viewSize.width + this.size.width/2;
    }
    else if (this.point.x > view.viewSize.width + this.size.width) {
      this.point.x = -this.size.width/2;
    }
    if (this.point.y < -this.size.height) {
      this.point.y = view.viewSize.height + this.size.height/2;
    }
    else if (this.point.y > view.viewSize.height + this.size.height) {
      this.point.y = -this.size.height/2;
    }
    this.body.position = this.point;
    this.drawEyes();
  },

  drawEyes: function() {
    // Don't change the eye's position if the vector is 0
    if (this.vector.length === 0) {
      return;
    }
    var eyeSize = 6;
    var destVector = (this.dest !== null) ? this.dest - this.point : this.vector;
    var eyesLocation = this.point + this.vector.normalize(this.size.width / 2 - eyeSize/2);
    var offsetVector = this.vector.clone().normalize(6);
    offsetVector.angle += 90;
    this.eye1.position = eyesLocation + offsetVector;
    this.pupil1.position = eyesLocation + destVector.normalize(eyeSize / 4) + offsetVector;
    this.eye2.position = eyesLocation - offsetVector;
    this.pupil2.position = eyesLocation + destVector.normalize(eyeSize / 4) - offsetVector;
  },

  updateStatus: function() {
    // Switch statuses based upon curiosity right now
    var switchingStatus = Math.floor(Math.random() + this.normalizeCuriosity());
    if (!switchingStatus) {
      return;
    }

    // Switch to a new status based upon environmental parameters
    animationSync.unregisterAnimation(this.animationId);
    if (this.status === Status.RESTING) {
      this.animationId = animationSync.registerAnimation(
        this.wander, 5 - 5 * this.normalizeCuriosity(), this);
      this.status = Status.WANDERING;
    }
    else {
      this.status = Status.RESTING;
    }
  },

  /**
   * Return curiosity normalized between 0 and 1
   */
  normalizeCuriosity: function() {
    return (this.attributes.curiosity + 1) / 2;
  },

  toString: function() {
    var str = [
      "Position: (" + round(this.point.x, 2) + "," + round(this.point.y, 2) +")",
      "Speed: " + round(this.vector.length, 2),
      "Direction: " + round(this.vector.angle, 2),
      "Status: " + this.status,
      "Attributes: " + JSON.stringify(this.attributes)
    ].join("\n");
    return str;
  }

};

/**
 * Setup:
 */
var critterArray = [];
var critterCount = 10;
for (var i = 0; i < critterCount; i++) {
  var newCritter = new Critter(
    new Point(Math.random() * view.viewSize.width,
      Math.random() * view.viewSize.height),
    new Point({length: 5, angle: Math.random() * 360}),
    new Size(20, 20),
    {topSpeed: 2}
  );
  critterArray.push(newCritter);
}

var status = new PointText(new Point(10, 20));
status.justification = 'left';
status.fillColor = 'black';

var pauseAnimation = false;

/**
 * Main looping:
 */
function onFrame(event) {
  if (pauseAnimation) {
    return;
  }

  for (var i = 0; i < critterCount; i++) {
    critterArray[i].iterate();
  }
  status.content = critterArray[0].toString();

  animationSync.advance(event.delta);
}

function onMouseDown(event) {
  pauseAnimation = !pauseAnimation;
}

function onResize(event) {
  SCREEN_WIDTH = view.viewSize.width;
  SCREEN_HEIGHT = view.viewSize.height;
}

/**
 * Helper functions:
 */
function round(number, precision) {
  if (precision < 0) {
    console.error("Round: precision cannot be less than 0");
  }
  var scaling = Math.pow(10, precision);
  return Math.round(number * scaling) / scaling;
}
