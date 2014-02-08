'use strict';

var CONNECTION_TIMEOUT = 2000;

function VNCClient($q, Io) {

  this.frameCallbacks = [];

  this.addFrameCallback = function (fn) {
    this.frameCallbacks.push(fn);
  };

  this.update = function (frame) {
    this.frameCallbacks.forEach(function (cb) {
      cb.call(null, frame);
    });
  };

  this.removeFrameCallback = function (fn) {
    var cbs = this.frameCallbacks;
    cbs.splice(cbs.indexOf(fn), 1);
  };

  this.sendMouseEvent = function (x, y, mask) {
    this.socket.emit('mouse', {
      x: x,
      y: y,
      button: mask
    });
  };

  this.sendKeyboardEvent = function (code, shift, isDown) {
    var rfbKey = this.toRfbKeyCode(code, shift, isDown);
    if (rfbKey)
      this.socket.emit('keyboard', {
        keyCode: rfbKey,
        isDown: isDown
      });
  };

  this.connect = function (config) {
    var deferred = $q.defer(),
        self = this;
    if (config.forceNewConnection) {
      this.socket = Io.connect(config.proxyUrl);
    } else {
      this.socket = Io.connect(config.proxyUrl, { 'force new connection': true });
    }
    this.socket.emit('init', {
      hostname: config.hostname,
      port: config.port,
      password: config.password
    });
    this.addHandlers();
    this.setConnectionTimeout(deferred);
    this.socket.on('init', function (config) {
      self.screenWidth = config.width;
      self.screenHeight = config.height;
      self.connected = true;
      clearTimeout(self.connectionTimeout);
      deferred.resolve();
    });
    return deferred.promise;
  };

  this.disconnect = function () {
    this.socket.disconnect();
    this.connected = false;
  };

  this.setConnectionTimeout = function (deferred) {
    var self = this;
    this.connectionTimeout = setTimeout(function () {
      self.disconnect();
      deferred.reject();
    }, CONNECTION_TIMEOUT);
  };

  this.addHandlers = function (success) {
    var self = this;
    this.socket.on('frame', function (frame) {
      self.update(frame);
    });
  };

  this.toRfbKeyCode = function (code, shift) {
    for (var i = 0, m = keyMap.length; i < m; i++)
      if (code == keyMap[i][0])
        return keyMap[i][shift ? 2 : 1];
    return null;
  };

}

angular.module('clientApp').service('VNCClient', VNCClient);
