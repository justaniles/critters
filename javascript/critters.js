

var Status = {
  WANDERING: "wandering",
  MOVING_TO: "moving to",
  SITTING_STILL: "sitting still"
};

// Critter object
function Critter(p, v, s) {
  this.point = p;
  this.vector = v;
  this.size = s;
  this.dest = new Point(Math.random() * view.viewSize.width,
    Math.random() * view.viewSize.height);
  this.status = Status.WANDERING;

  // Counters to modify the animation speed of certain things.
  // Larger maxes = slower animations.
  this.counters = {
    movement: {value: 0, max: 0, name: "movement"},
    wander: {value: 0, max: 100, name: "wander"}
  };

  // build the body path
  this.body = new Path();
  this.body.add(new Point(this.point.x + this.size.width / 2, this.point.y));
  this.body.add(new Point(this.point.x, this.point.y));
  this.body.add(new Point(this.point.x - this.size.width / 2, this.point.y));
  this.body.style = {
    strokeColor: "black",
    strokeWidth: this.size.height,
    strokeCap: "round",
    strokeJoin: "round"
  };
  this.body.selected = false;

  // current segment is used to iterate over the segments and animate them one-by-one
  this.currentSegment = this.body.firstSegment;
  this.segmentLength = this.size.width;
}
Critter.prototype = {

  iterate: function() {

    // Decrement each counter and call appropriate function when a counter reaches 0
    for (var prop in this.counters) {
      var currentCounter = this.counters[prop];
      currentCounter.value -= 1;

      // If this counter reaches 0, call the function associated with the counter
      // and reset its value back to max
      if (currentCounter.value <= 0) {
        switch(currentCounter.name) {
          case "movement":
            this.move();
            break
          case "wander":
            this.wander();
            break;
          default:
            console.log("Unknown counter: " + currentCounter.name);
            break;
        }
        // executeFunctionByName("this." + currentCounter.function, window);
        currentCounter.value = currentCounter.max;
      }
    }

    // Update vector
    var destVector = this.dest - this.body.firstSegment.point;
    this.vector.length = 1;
    this.vector.angle += this.vector.getDirectedAngle(destVector) / 10;
  },

  move: function() {
    if (this.status === Status.SITTING_STILL) {
      return;
    }

    // If this is the first segment, move it towards the dest
    var prevSegment = this.currentSegment.previous;
    if (prevSegment === null) {
      this.currentSegment.point += this.vector;
    }
    // Otherwise, move the segment to the correct distance from the previous segment
    else {
      var prevVector = prevSegment.point - this.currentSegment.point;
      this.currentSegment.point = prevSegment.point
        - prevVector.normalize(this.segmentLength);
    }

    // Now increment to the next segment, wrapping if necessary
    this.currentSegment = this.currentSegment.next;
    if (this.currentSegment === null) {
      this.currentSegment = this.body.firstSegment;
    }
  },

  wander: function() {
    // only "wander" if that's our status
    if (this.status !== Status.WANDERING) {
      return;
    }
    this.dest.x = Math.random() * view.viewSize.width;
    this.dest.y = Math.random() * view.viewSize.height;
  }

};

/**
 * Setup:
 */
var critterArray = [];
var critterCount = 1;
for (var i = 0; i < critterCount; i++) {
  var newCritter = new Critter(
    new Point(Math.random() * view.viewSize.width,
      Math.random() * view.viewSize.height),
    new Point({length: 5, angle: Math.random() * 360}),
    new Size(20, 30)
  );

  critterArray.push(newCritter);
}

/**
 * Main looping:
 */
function onFrame() {
  for (var i = 0; i < critterCount; i++) {
    critterArray[i].iterate();
  }
}
