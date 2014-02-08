var RFB = require('rfb'),
    winston = require('winston'),
    io = require('socket.io'),
    Png = require('../node_modules/node-png/build/Release/png').Png,
    express = require('express'),
    http = require('http'),
    clients = [],
    Config = {
      HTTP_PORT: 8090
    };

function createRfbConnection(config, socket) {
  try {
    var r = RFB({
      host: config.hostname,
      port: config.port,
      password: config.password,
      securityType: 'vnc',
    });
  } catch (e) {
    console.log(e);
  }
  addEventHandlers(r, socket);
  return r;
}

function addEventHandlers(r, socket) {

  var initialized = false,
      screenWidth, screenHeight;

  function handleConnection(width, height) {
    screenWidth = width;
    screenHeight = height;
    winston.info('RFB connection established')
    socket.emit('init', {
      width: width,
      height: height
    });
    clients.push({
      socket: socket,
      rfb: r,
      interval: setInterval(function () {
        r.requestRedraw();
      }, 1000)
    });
    r.requestRedraw();
    initialized = true;
  }

  r.on('error', function () {
    winston.info('Error while talking with the remote RFB server');
  });

  r.on('raw', function (rect) {
    !initialized && handleConnection(rect.width, rect.height);
    handleFrame(socket, rect, r);
    r.requestUpdate({
      x: 0,
      y: 0,
      subscribe: 1,
      width: screenWidth,
      height: screenHeight
    });
  });

  r.on('*', function () {
    winston.error(arguments);
  });
}

function handleFrame(socket, rect, r) {
  var rgb = new Buffer(rect.width * rect.height * 3, 'binary'),
      offset = 0;

  for (var i = 0; i < rect.fb.length; i += 4) {
    rgb[offset++] = rect.fb[i + 2];
    rgb[offset++] = rect.fb[i + 1];
    rgb[offset++] = rect.fb[i];
  }
  var image = new Png(rgb, rect.width, rect.height, 'rgb');
  image = image.encodeSync();
  socket.emit('frame', {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    image: image.toString('base64')
  });
}

function disconnectClient(socket) {
  clients.forEach(function (client) {
    if (client.socket === socket) {
      client.rfb.end();
      clearInterval(client.interval);
    }
  });
  clients = clients.filter(function (client) {
    return client.socket === socket;
  });
}

exports.run = function () {
  var app = express(),
      server = http.createServer(app);

  app.use(express.static(__dirname + '/../../client/app'));
  server.listen(Config.HTTP_PORT);

  console.log('Listening on port', Config.HTTP_PORT);

  io = io.listen(server, { log: false })
  io.sockets.on('connection', function (socket) {
    winston.info('Client connected');
    socket.on('init', function (config) {
      var r = createRfbConnection(config, socket);
      socket.on('mouse', function (evnt) {
        r.sendPointer(evnt.x, evnt.y, evnt.button);
      });
      socket.on('keyboard', function (evnt) {
        r.sendKey(evnt.keyCode, evnt.isDown);
        winston.info('Keyboard input')
      });
      socket.on('disconnect', function () {
        disconnectClient(socket);
        winston.info('Client disconnected')
      });
    });
  });
};