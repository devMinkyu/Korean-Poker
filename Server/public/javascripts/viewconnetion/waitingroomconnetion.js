var socket = io.connect();
var user = document.getElementById("playerName").innerHTML;

socket.emit('WaitingRoomConnection_send', "WaitingRoom",user);

$('#chat').on('submit', function(){
    socket.emit('WaitingRoomMessage_send', $('#message').val());
    $('#message').val("");
});
socket.on('WaitingRoomMessage_receive', function(msg){
    $('#chatLog').append(msg+"\n");
    $('#chatLog').scrollTop($('#chatLog').innerHeight());
});
window.onbeforeunload = function() {
    socket.emit('WaitingRoomLeave_send');
}   