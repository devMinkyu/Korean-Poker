var socket = io.connect();
var user = document.getElementById("playerName").innerHTML;
var count = 0;
socket.emit('WaitingRoomConnection_send', "WaitingRoom",user);

$('#chat').on('submit', function(e){
    socket.emit('WaitingRoomMessage_send', $('#message').val());
    $('#message').val("");
    e.preventDefault();
});
socket.on('WaitingRoomMessage_receive', function(msg){
    $('#chatLog').append(msg+"\n");
    $('#chatLog').scrollTop(count);
    count += 50;
});
window.onbeforeunload = function() {
    socket.emit('WaitingRoomLeave_send');
}   

function buttonSound(str) { 
  var music = document.getElementById("music");
  music.src = str;
  music.play();
}