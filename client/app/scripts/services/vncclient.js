'use strict';

function VNCClient(Io) {
  //this.screen = screen;
  //this.vncClientScreen = vncClientScreen;
}

VNCClient.prototype.initEventListeners = function () {
  var self = this;
  this.screen.addMouseHandler(function (x, y, mask) {
    self.socket.emit('mouse', {
      x: x,
      y: y,
      button: mask
    });
  });
  this.screen.addKeyboardHandlers(function (code, shift, isDown) {
    var rfbKey = self.toRfbKeyCode(code, shift, isDown);
    if (rfbKey)
      self.socket.emit('keyboard', {
        keyCode: rfbKey,
        isDown: isDown
      });
  });
};

VNCClient.prototype.connect = function (config) {
  var self = this;
  if (config.forceNewConnection) {
    this.socket = io.connect(Config.URL);
  } else {
    this.socket = io.connect(Config.URL, { 'force new connection': true });
  }
  this.socket.emit('init', {
    host: config.host,
    port: config.port,
    password: config.password
  });
  this.addHandlers(config.success);
  this.initEventListeners();
  this.connectionTimeout = setTimeout(function () {
    self.disconnect();
    config.error();
  }, Config.CONNECTION_TIMEOUT);
};

VNCClient.prototype.disconnect = function () {
  this.socket.disconnect();
};

VNCClient.prototype.addHandlers = function (success) {
  var self = this;
  this.socket.on('init', function (config) {
    var canvas = self.vncClientScreen.getCanvas();
    canvas.width = config.width;
    canvas.height = config.height;
    self.screen.resize();
    clearTimeout(self.connectionTimeout);
    if (typeof success === 'function') success();
  });
  this.socket.on('frame', function (frame) {
    self.vncClientScreen.drawRect(frame);
  });
};

VNCClient.prototype.toRfbKeyCode = function (code, shift) {
  for (var i = 0, m = keyMap.length; i < m; i++)
    if (code == keyMap[i][0])
      return keyMap[i][shift ? 2 : 1];
  return null;
};

angular.module('clientApp').service('VNCClient', VNCClient);
