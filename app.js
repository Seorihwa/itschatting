var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs');

app.listen(process.env.PORT || 9000);

function handler(req, res) {
  fs.readFile(__dirname + 'index.html',
    function (err, data) {
      if(err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200);
      data = data.toString('utf-8').replace('<%=host%', req.headers.host);
      res.end(data);
    }
  );
};

// socket.io Setting
io.configure(function() {
  io.set('transports', ['xhr-polling']);
  io.set('polling duration', 10);
  io.set('log level', 2);
});

var socketRoom = {};

io.sockets.on('connection', function(socket){
  // Notice connection is complete
  socket.emit('connected');

  // When Client request chat
  socket.on('requestRandomChat', function(data) {
    // Check empty room
    console.log('requestRandomChat');
    var rooms = io.sockets.manager.rooms;
    for (var key in rooms) {
      if(key == "") {
        continue;
      }

      // If he/she is only, entered that room
      if(rooms[key].length == 1) {
        var roomKey = key.replace('/', '');
        socket.join(roomKey);
        io.sockets.in(roomKey).emit('completeMatch', {});
        socketRoom[socket.id] = roomKey;
        return;
      }
    }

    // If doesn't exist empty room, just wait before make new room
    socket.join(socket.id);
    socketRoom[socket.id] = socket.id;
  });

  // When he/she canceled request
  socket.on('cancelRequest', function(data) {
    socket.leave(socketRoom[socket.id]);
  });

  // When he/she send the message (Client to Server)
  socket.on('sendMessage', function(data) {
    console.log('sendMessage');
    io.sockets.in(socketRoom[socket.id]).emit('receiveMessage', data);
  });

  // Disconnect
  socket.on('disconnect', function(data) {
    var key = socketRooms[socket.id];
    socket.leave(key);
    io.sockets.in(key).emit('disconnect');
    var clients = io.sockets.clients(key);
    for (var i = 0; i < clients.length ; i++) {
      clients[i].leave(key);
    }
  });
});
