var express = require('express');
var app = express();
var path = require('path');

app.use(express.static(path.join(__dirname, '/client/static')));

app.set('views', path.join(__dirname, '/client/views'));

app.set('view engine', 'ejs');

app.get('/', function(req,res){
  res.render('index');
})

var server = app.listen(1234, function(){
  console.log('Listening on port 1234');
})

var chatrooms = [];
var connectedUsers = {};
var chatroomComments = [];

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket){
  socket.join(socket.id);

  socket.on('newUser', function(data){
    connectedUsers[data.user] = socket.id;
    for(name in connectedUsers){
      if(connectedUsers[name] == socket.id){
        var userName = name;
      }
    }
    socket.emit('currentRooms', {currentRooms: chatrooms});
    io.emit('newUser', {connectedUsers, user: userName});
  })

  socket.on('mainChat', function(data){
    io.emit('mainChat', {user: data.user, comment: data.comment});
  })

  socket.on('newChatroom', function(data){
    chatrooms.push(data.chatroom);
    socket.join(data.chatroom);
    socket.broadcast.emit('newChatroom', {chatrooms: chatrooms});
  })

  socket.on('joiningRoom', function(data){
    socket.join(data.room);
    // get user joining room by socket.id
    for(name in connectedUsers){
      if(connectedUsers[name] == socket.id){
        var userName = name;
      }
    }
    socket.emit('joiningRoom', {joinedUser: userName, comments: chatroomComments, room: data.room});
  })

  socket.on('privateChat', function(data){
    for(name in connectedUsers){
      if(connectedUsers[name] == socket.id){
        var userName = name;
      }
    }
    socket.broadcast.to(connectedUsers[data.user]).emit('privateChat', {user: userName, comment: data.comment});
  })

  socket.on('addComment', function(data){
    // get user adding comment by socket.id
    for(name in connectedUsers){
      if(connectedUsers[name] == socket.id){
        var userName = name;
      }
    }
    chatroomComments.push({room: data.room, user: userName, comment: data.comment});

    io.in(data.room).emit('addComment', {roomComments: chatroomComments, currentRoom: data.room});
  })

})
