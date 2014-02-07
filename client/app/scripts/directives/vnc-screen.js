'use strict';

function Screen(canvas, vncClient) {
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  this.vncClientScreen = vncClient;
  this.addEventListener();
  this.resize();
}

Screen.prototype.resize = function () {
  var canvas = this.vncClientScreen.getCanvas(),
      ratio = canvas.width / canvas.height,
      width = window.innerWidth,
      height = window.innerHeight;
  this.canvas.width = width;
  this.canvas.height = width / ratio;
  if (this.canvas.height > height) {
    this.canvas.height = height;
    this.canvas.width = height * ratio;
  }
  this.redraw();
};

Screen.prototype.resizeHandler = function () {
  var self = this;
  return this.resizeHandler = function () {
    self.resize();
  };
};

Screen.prototype.addEventListener = function () {
  var self = this;
  this.vncClientScreen.onUpdate(function () {
    self.redraw();
  });
  window.addEventListener('resize', this.resizeHandler(), false);
};

Screen.prototype.addMouseHandler = function (cb) {
  var buttonsState = [0, 0, 0],
      self = this;

  function getMask() {
    var copy = Array.prototype.slice.call(buttonsState);
        buttons = copy.reverse().join('');
    return parseInt(buttons, 2);
  }

  function getMousePosition(x, y) {
    var c = self.canvas,
        oc = self.vncClientScreen.getCanvas(),
        pos = c.getBoundingClientRect(),
        width = c.width,
        height = c.height,
        oWidth = oc.width,
        oHeight = oc.height,
        widthRatio = width / oWidth,
        heightRatio = height / oHeight;
    return {
      x: x / widthRatio - pos.left,
      y: y / heightRatio - pos.top
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

Screen.prototype.addKeyboardHandlers = function (cb) {
  document.addEventListener('keydown', this.keyDownHandler(cb), false);
  document.addEventListener('keyup', this.keyUpHandler(cb), false);
};

Screen.prototype.redraw = function () {
  var canvas = this.vncClientScreen.getCanvas();
  this.context.drawImage(canvas, 0, 0, this.canvas.width, this.canvas.height);
};

Screen.prototype.destroy = function () {
  document.removeEventListener('keydown', this.keyDownHandler);
  document.removeEventListener('keyup', this.keyUpHandler);
  window.removeEventListener('resize', this.resizeHandler);
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

VNCClientScreen.prototype.onUpdate = function (cb) {
  this.onUpdateCbs.push(cb);
};

var VNCScreenDirective = function (VNCClient) {
  return {
    template: '<canvas></canvas>',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      element.text('this is the vncScreen directive');
    }
  };
};

angular.module('clientApp').directive('vncScreen', VNCScreenDirective);
