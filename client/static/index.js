$(document).ready(function(){
  var currentuser = prompt("Enter your name");
  var socket = io.connect();

  // broadcast new user
  if(currentuser){
    socket.emit('newUser', {user: currentuser});
  }

  // broadcast main chat addition
  $('.mainChat').click(function(){
    var comment = $(this).siblings('input').val();
    $(this).siblings('input').val('');
    socket.emit('mainChat', {user: currentuser, comment: comment});
  })

  // append to comment to main chat
  socket.on('mainChat', function(data){
    $('#mainChat').append('<p>' + data.user + ' says ' + data.comment + '</p>');
  })

  // get all available rooms after new user login
  socket.on('currentRooms', function(data){
    var rooms = '';
    for(room in data.currentRooms){
      rooms += '<p>' + data.currentRooms[room] + ' <button type="submit" class="groupchat" value="' + data.currentRooms[room] + '">Enter</button></p>';
    }
    $('#chatrooms').html(rooms);
    // this allows new users to join existing chatrooms
    $('.groupchat').unbind('click');
    chatroomListeners();
  })

  // button clicked to add new chatroom
  $('.addChatroom').on('click', function(){
    var chatroom = $(this).siblings('input').val();
    chatroom = chatroom.replace(/\s/g,'-');
    $('#currentChatrooms').append('<div class="roomComments" name="'+ chatroom +'"><hr><p><strong>' + chatroom + '</strong></p><input class="comments"><button class="addcomment">Post Comment</button></div>');
    socket.emit('newChatroom', {chatroom: chatroom});
    $(this).siblings('input').val('');
    // allows you to add comments to newly added chatroom
    $('.addcomment').unbind('click');
    addListeners();
  })

  // append new user to allUsers div
  socket.on('newUser', function(data){
    var userList = '';
    for(user in data.connectedUsers){
      if(user != currentuser){
        userList += '<div name="' + user +'"><p class="users" value="' + user + '">' + user + '</p><input class="privateChat" type="text"><br><button class="privateComment" type="submit">Send message</button></div>';
      }
    }
    $('#users').html(userList);

    $('.privateComment').click(function(){
      var comment = $(this).siblings('input').val();
      $(this).siblings('input').val('');
      var user = $(this).parent().attr('name');
      socket.emit('privateChat', {comment: comment, user: user});
    })
  })

  // append new Chatroom to allChatroom div
  socket.on('newChatroom', function(data){
    for (var i = 0; i < data.chatrooms.length; i ++) {
    var rooms = '';
      rooms += '<p>' + data.chatrooms[i] + ' <button type="submit" class="groupchat" value="' + data.chatrooms[i] + '">Enter</button></p>';
    };
    $('#chatrooms').append(rooms)

    $('.groupchat').unbind('click');
    $('.groupchat').on('click', function(){
      var room = $(this).attr('value');
      $('#currentChatrooms').append('<div class="roomComments" name="'+ room +'"><hr><p><strong>' + room + '</strong></p><input class="comments"><button class="addcomment">Post Comment</button></div>');
      socket.emit('joiningRoom', {room: room});
      $(this).parent().remove();
      $('.addcomment').unbind('click');
      addListeners();
    })
  })

  // append private chats to privateChat div
  socket.on('privateChat', function(data){
    $('#privateChat').append('<div name="' + data.user + '"><p>' + data.user + ' says ' + data.comment + '.</p></div>');
  })

  // append joined chatroom to your chatroom div
  socket.on('joiningRoom', function(data){
    var chatroomComments = '';
    for(comment in data.comments){
      // upon joining chatroom add append all comments
      if(data.comments[comment].room === data.room){
        chatroomComments += '<p>' + data.comments[comment].user + ' said ' + data.comments[comment].comment + '</p>';
      }
    }
    $('.roomComments[name=' + data.room + ']').append(chatroomComments);
  })

  // append new comments for chatroom to your chatroom div
  socket.on('addComment', function(data){
    // for new comment, only the last comment will be appended
    for(comment in data.roomComments){
      var chatroomComments = '';
      if(data.roomComments[comment].room === data.currentRoom){
        chatroomComments += '<p>' + data.roomComments[comment].user + ' said ' + data.roomComments[comment].comment + '</p>';
      }
    }
    $('.roomComments[name=' + data.currentRoom + ']').append(chatroomComments);
  })

  // listeners for adding new comments
  function addListeners(){
    $('.addcomment').click(function(e){
      var room = $(this).parent().attr('name');
      var comment = $(this).siblings('input').val();
      $(this).siblings('input').val('');
      socket.emit('addComment', {comment: comment, room: room})
    })
  }

  // listeners for adding new chatrooms
  function chatroomListeners(){
    $('.groupchat').on('click', function(){
      var room = $(this).attr('value');
      $('#currentChatrooms').append('<div class="roomComments" name="'+ room +'"><hr><p><stong>' + room + '</stong></p><input class="comments"><button class="addcomment">Post Comment</button></div>');
      socket.emit('joiningRoom', {room: room});
      $(this).parent().remove();
      $('.addcomment').unbind('click');
      addListeners();
    })
  }

})