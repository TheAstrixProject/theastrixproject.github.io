// Generated by CoffeeScript 1.10.0
(function() {
  var clickS, drawObject, fastS, fps, initState, inputS, isPaused, lastClick, lastView, modelP, pauseP, pauseS, resetS, resizeS, scale, screenSize, simSpeed, slowS, speedP, speedS, updateObject, viewPort;

  fps = 60;

  isPaused = false;

  simSpeed = 50000;

  scale = 1350000;

  viewPort = new Util.Vector2(0, 0);

  lastView = new Util.Vector2(0, 0);

  lastClick = new Util.Vector2(0, 0);

  updateObject = function(object, allObjects) {
    var acceleration;
    acceleration = Phys.totalGravityVector(object, allObjects).multiply(1 / fps).multiply(simSpeed);
    object.velocity = object.velocity.add(acceleration);
    object.xCoord -= (object.velocity.X / fps) * simSpeed;
    return object.yCoord -= (object.velocity.Y / fps) * simSpeed;
  };

  drawObject = function(object) {
    var canvasContext;
    canvasContext = $('#screen')[0].getContext('2d');
    return canvasContext.drawImage($('#POL')[0], (object.xCoord / scale) - (object.radius / scale) + viewPort.X, (object.yCoord / scale) - (object.radius / scale) + viewPort.Y, (object.radius / scale) * 2, (object.radius / scale) * 2);
  };

  resizeS = $(window).asEventStream('resize');

  clickS = $('#screen').asEventStream('mousedown mouseup mousemove mousewheel');

  resetS = $('#reset').asEventStream('click').map('reset');

  pauseS = $('#pause').asEventStream('click');

  slowS = $('#slower').asEventStream('click').map(1 / 2);

  fastS = $('#faster').asEventStream('click').map(2);

  speedS = slowS.merge(fastS);

  inputS = new Bacon.Bus();

  inputS.plug(clickS.merge(resetS));

  resizeS.onValue(Util.sizeCanvas);

  initState = function() {
    var s;
    s = [new Phys.Celestial(0, 0), new Phys.Celestial(0, 3.844e8)];
    s[0].velocity = new Util.Vector2(-12.325, 0);
    s[1].mass = 7.35e22;
    s[1].radius = 1.75e6;
    s[1].velocity = new Util.Vector2(1000, 0);
    return s;
  };

  modelP = inputS.scan(initState(), function(model, event) {
    var shift;
    if (typeof event === 'string') {
      if (event.slice(0, 7) === 'delete ') {
        return model.filter(function(x) {
          return x.UUID !== event.slice(7);
        });
      }
      if (event === 'reset') {
        return initState();
      }
    }
    if (event.type === 'mousedown') {
      if (event.which === 1) {
        return model.concat(new Phys.Celestial((event.offsetX - viewPort.X) * scale, (event.offsetY - viewPort.Y) * scale));
      }
      if (event.which === 2) {
        lastView = viewPort;
        lastClick = new Util.Vector2(event.offsetX, event.offsetY);
        return model;
      }
    }
    if (event.type === 'mouseup' || event.type === 'mousemove') {
      if (event.which === 2) {
        shift = new Util.Vector2(event.offsetX - lastClick.X, event.offsetY - lastClick.Y);
        viewPort = lastView.add(shift);
        return model;
      } else {
        return model;
      }
    }
    if (event.type === 'mousewheel') {
      if (event.originalEvent.wheelDelta > 0) {
        scale = Math.round(scale * 0.9);
      } else {
        scale = Math.round(scale * 1.1);
      }
      return model;
    }
  });

  pauseP = pauseS.map(1).scan(1, function(accumulator, value) {
    return accumulator + value;
  }).map(function(value) {
    return value % 2 === 0;
  });

  pauseP.onValue(function(newPause) {
    return isPaused = newPause;
  });

  pauseP.map(function(pause) {
    if (pause) {
      return 'Play';
    } else {
      return 'Pause';
    }
  }).assign($('#pause'), 'text');

  speedP = speedS.scan(simSpeed, function(accumulator, factor) {
    return Math.round(accumulator * factor);
  });

  speedP.onValue(function(newSpeed) {
    return simSpeed = newSpeed;
  });

  speedP.assign($('#speed'), 'text');

  screenSize = Util.sizeCanvas();

  viewPort = screenSize.multiply(1 / 2);

  modelP.sample(Util.ticksToMilliseconds(fps)).onValue(function(model) {
    var i, j, k, len, len1, len2, object, results;
    Util.clear();
    for (i = 0, len = model.length; i < len; i++) {
      object = model[i];
      if (!isPaused) {
        updateObject(object, model);
      }
    }
    for (j = 0, len1 = model.length; j < len1; j++) {
      object = model[j];
      if (Phys.checkCollisions(object, model).length > 0) {
        inputS.push('delete ' + object.UUID);
      }
    }
    results = [];
    for (k = 0, len2 = model.length; k < len2; k++) {
      object = model[k];
      results.push(drawObject(object));
    }
    return results;
  });

}).call(this);
