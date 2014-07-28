'use strict';

function Screen(canvas, buffer) {
  var bufferCanvas = buffer.getCanvas();
  this.originalWidth = bufferCanvas.width;
  this.originalHeight = bufferCanvas.height;
  this.buffer = buffer;
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  this.resize(bufferCanvas);
}

Screen.prototype.resize = function () {
  var canvas = this.buffer.getCanvas(),
      ratio = canvas.width / canvas.height,
      parent = this.canvas.parentNode,
      width = parent.offsetWidth,
      height = parent.offsetHeight;
  this.canvas.width = width;
  this.canvas.height = width / ratio;
  if (this.canvas.height > height) {
    this.canvas.height = height;
    this.canvas.width = height * ratio;
  }
  this.redraw();
};

Screen.prototype.addMouseHandler = function (cb) {
  var buttonsState = [0, 0, 0],
      self = this;

  function getMask() {
    var copy = Array.prototype.slice.call(buttonsState),
        buttons = copy.reverse().join('');
    return parseInt(buttons, 2);
  }

  function getMousePosition(x, y) {
    var c = self.canvas,
        oc = self.buffer.getCanvas(),
        pos = c.getBoundingClientRect(),
        width = c.width,
        height = c.height,
        oWidth = oc.width,
        oHeight = oc.height,
        widthRatio = width / oWidth,
        heightRatio = height / oHeight;
    return {
      x: (x - pos.left) / widthRatio,
      y: (y - pos.top) / heightRatio
    };
  }

  this.canvas.addEventListener('mousedown', function (e) {
    if (e.button === 0 || e.button === 2) {
      buttonsState[e.button] = 1;
      var pos = getMousePosition(e.pageX, e.pageY);
      cb.call(null, pos.x, pos.y, getMask());
    }
    e.preventDefault();
  }, false);
  this.canvas.addEventListener('mouseup', function (e) {
    if (e.button === 0 || e.button === 2) {
      buttonsState[e.button] = 0;
      var pos = getMousePosition(e.pageX, e.pageY);
      cb.call(null, pos.x, pos.y, getMask());
    }
    e.preventDefault();
  }, false);
  this.canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });
  this.canvas.addEventListener('mousemove', function (e) {
    var pos = getMousePosition(e.pageX, e.pageY);
    cb.call(null, pos.x, pos.y, getMask());
    e.preventDefault();
  }, false);
};

Screen.prototype.addKeyboardHandlers = function (cb) {
  document.addEventListener('keydown', this.keyDownHandler(cb), false);
  document.addEventListener('keyup', this.keyUpHandler(cb), false);
};

Screen.prototype.keyUpHandler = function (cb) {
  return this.keyUpHandler = function (e) {
    cb.call(null, e.keyCode, e.shiftKey, 1);
    e.preventDefault();
  };
};

Screen.prototype.keyDownHandler = function (cb) {
  return this.keyDownHandler = function (e) {
    cb.call(null, e.keyCode, e.shiftKey, 0);
    e.preventDefault();
  };
};

Screen.prototype.redraw = function () {
  var canvas = this.buffer.getCanvas();
  this.context.drawImage(canvas, 0, 0, this.canvas.width, this.canvas.height);
};

Screen.prototype.destroy = function () {
  document.removeEventListener('keydown', this.keyDownHandler);
  document.removeEventListener('keyup', this.keyUpHandler);
  this.canvas.removeEventListener('contextmenu');
  this.canvas.removeEventListener('mousemove');
  this.canvas.removeEventListener('mousedown');
  this.canvas.removeEventListener('mouseup');
};

function VNCClientScreen(canvas) {
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  this.onUpdateCbs = [];
}

VNCClientScreen.prototype.drawRect = function (rect) {
  var img = new Image(),
      self = this;
  img.width = rect.width;
  img.height = rect.height;
  img.src = 'data:image/png;base64,' + rect.image;
  img.onload = function () {
    self.context.drawImage(this, rect.x, rect.y, rect.width, rect.height);
    self.onUpdateCbs.forEach(function (cb) {
      cb();
    });
  };
};

VNCClientScreen.prototype.getCanvas = function () {
  return this.canvas;
};

var VNCScreenDirective = function (VNCClient) {
  return {
    template: '<canvas class="vnc-screen"></canvas>',
    replace: true,
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      if (!VNCClient.connected) {
        angular.element('<span>No VNC connection.</span>').insertAfter(element);
        element.hide();
        return;
      }

      function frameCallback(buffer, screen) {
        return function (frame) {
          buffer.drawRect(frame);
          screen.redraw(buffer.getCanvas());
        };
      }

      function createHiddenCanvas(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.style.position = 'absolute';
        canvas.style.top = -height + 'px';
        canvas.style.left = -width + 'px';
        canvas.style.visibility = 'hidden';
        document.body.appendChild(canvas);
        return canvas;
      }

      var bufferCanvas = createHiddenCanvas(VNCClient.screenWidth, VNCClient.screenHeight),
          buffer = new VNCClientScreen(bufferCanvas),
          screen = new Screen(element[0], buffer),
          callback = frameCallback(buffer, screen);

      VNCClient.addFrameCallback(callback);
      screen.addKeyboardHandlers(VNCClient.sendKeyboardEvent.bind(VNCClient));
      screen.addMouseHandler(VNCClient.sendMouseEvent.bind(VNCClient));

      scope.$on('$destroy', function () {
        VNCClient.removeFrameCallback(callback);
        bufferCanvas.remove();
      });
    }
  };
};

angular.module('clientApp').directive('vncScreen', VNCScreenDirective);
