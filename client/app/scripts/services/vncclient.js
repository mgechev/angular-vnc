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
    var keyMap = VNCClient.keyMap;
    for (var i = 0, m = keyMap.length; i < m; i++)
      if (code == keyMap[i][0])
        return keyMap[i][shift ? 2 : 1];
    return null;
  };

}

VNCClient.keyMap = [[8,65288,65288],[9,65289,65289],[13,65293,65293],[16,65505,65505],[16,65506,65506],[17,65507,65507],[17,65508,65508],[18,65513,65513],[18,65514,65514],[27,65307,65307],[32,32,32],[33,65365,65365],[34,65366,65366],[35,65367,65367],[36,65360,65360],[37,65361,65361],[38,65362,65362],[39,65363,65363],[40,65364,65364],[45,65379,65379],[46,65535,65535],[48,48,41],[49,49,33],[50,50,64],[51,51,35],[52,52,36],[53,53,37],[54,54,94],[55,55,38],[56,56,42],[57,57,40],[65,97,65],[66,98,66],[67,99,67],[68,100,68],[69,101,69],[70,102,70],[71,103,71],[72,104,72],[73,105,73],[74,106,74],[75,107,75],[76,108,76],[77,109,77],[78,110,78],[79,111,79],[80,112,80],[81,113,81],[82,114,82],[83,115,83],[84,116,84],[85,117,85],[86,118,86],[87,119,87],[88,120,88],[89,121,89],[90,122,90],[97,49,49],[98,50,50],[99,51,51],[100,52,52],[101,53,53],[102,54,54],[103,55,55],[104,56,56],[105,57,57],[106,42,42],[107,61,61],[109,45,45],[110,46,46],[111,47,47],[112,65470,65470],[113,65471,65471],[114,65472,65472],[115,65473,65473],[116,65474,65474],[117,65475,65475],[118,65476,65476],[119,65477,65477],[120,65478,65478],[121,65479,65479],[122,65480,65480],[123,65481,65481],[186,59,58],[187,61,43],[188,44,60],[189,45,95],[190,46,62],[191,47,63],[192,96,126],[220,92,124],[221,93,125],[222,39,34],[219,91,123]];

angular.module('clientApp').service('VNCClient', VNCClient);
