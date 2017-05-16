var socket = io.connect();
var element = document.getElementById("_id");
var currentUserName = document.getElementById("userName").innerHTML;
$("#secondButton").hide();
$("#thirdButton").hide();
$("#cardButton").hide();

// 연결
socket.emit('room_connection_send', element.innerHTML-1, currentUserName);
socket.on('room_connection_receive', function(users){
  $("#userWindow").append($('#rowTemplate1').html());
  var name = document.getElementsByName("username");
  var win = document.getElementsByName("win");
  var lose = document.getElementsByName("lose");
  var state = document.getElementsByName("state");
  for(var i = 0; i < users.length; i++){
    name[i].innerHTML = users[i].userName;
    win[i].innerHTML = "승: " + users[i].win;
    lose[i].innerHTML = "/ 패: " + users[i].lose;
    if(users[i].isReady === true)
      state[i].innerHTML = "준비 완료";
    else
      state[i].innerHTML = "대기 중";
  }
});

// 채팅
$('#chat').on('submit', function(e){
  socket.emit('message_send', $('#message').val());
  $('#message').val("");
  e.preventDefault();
});
socket.on('message_receive', function(msg){
  $('#chatLog').append(msg+"\n");
  $('#chatLog').scrollTop($('#chatLog').innerHeight());
});

// 준비 눌렀을 때
$('#ready').click('submit', function(e){
  socket.emit('ready_send');
});
socket.on('ready_receive', function(users, index){
  var state = document.getElementsByName("state");
  if(users[index].isReady === true)
    state[index].innerHTML = "준비 완료";
  else
    state[index].innerHTML = "대기 중";
});

//게임 시작후 카드 뿌려주기
socket.on('start_game', function(cards, room){
  $("#cardButton").show();
  $("#cardButton #card3").hide();
  $("#firstButton").hide();
  $('#userWindow').empty();
  for(var i = 0; i < room.connUsers.length; i++){
    $("#userWindow").append($('#rowTemplate2').html());
  }
  var name = document.getElementsByName("username");
  var money = document.getElementsByName("money");
  var turn = document.getElementsByName("turn");
  var currentUserName = document.getElementById("userName").innerHTML;
  for(var j = 0; j < room.connUsers.length; j++){
    name[j].innerHTML = room.connUsers[j].userName;
    if(currentUserName == room.connUsers[j].userName){
      $('#card1').val(cards[2*j]);
      //document.getElementById("card1").innerHTML = cards[2*j];
      document.getElementById("card2").innerHTML = cards[2*j+1];
      document.getElementById("cardImforamtion1").innerHTML = cards[2*j] + "/ ";
      document.getElementById("cardImforamtion2").innerHTML = cards[2*j+1] + "/ ";
    }
    money[j].innerHTML = "금액: " + room.connUsers[j].money;
    if(room.currentTurnUser == room.connUsers[j].userName)
      turn[j].innerHTML = "현재 턴";
    else
      turn[j].innerHTML = "대기 중";
  }
});
// 첫번쨰 카드 눌렀을때
$('#card1').click('submit', function(e){
  //var card = document.getElementById("card1").innerHTML;
  var card = $('#card1').val();
  var roomMoney = (document.getElementById("roomMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  socket.emit('one_open_card_send', card, 1*roomMoneyNumber);
});
// 두번쨰 카드 눌렀을때
$('#card2').click('submit', function(e){
  var card = document.getElementById("card2").innerHTML;
  var roomMoney = (document.getElementById("roomMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  socket.emit('one_open_card_send', card, 1*roomMoneyNumber);
});
// 카드한장을 눌렀을 때 반응하는 소켓
socket.on('one_open_card_receive', function(card, room, user){
  document.getElementById("roomAllMoney").innerHTML = room.roomAllMoney;
  var openCard = document.getElementsByName("opencard");
  var turn = document.getElementsByName("turn");
  var money = document.getElementsByName("money");

  for(var i = 0; i < room.connUsers.length; i++){
    if(user.userName == room.connUsers[i].userName){
      openCard[i].innerHTML = card;
      money[i].innerHTML = room.connUsers[i].money;
    }
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].innerHTML = "현재 턴";
    else
      turn[i].innerHTML = "대기 중";
    }
});
// 한장씩 다 공개했을때 반응하는 소켄
socket.on('one_open_card_end_receive',function(room){
  var die = document.getElementsByName("dieState");
  var turn = document.getElementsByName("turn");
  for(var i = 0; i < room.connUsers.length; i++){
    if(currentUserName == room.connUsers[i].userName && die[i].innerHTML != "Die"){
      $("#secondButton").show();
      $("#cardButton").hide();
    }
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].innerHTML = "현재 턴";
    else
      turn[i].innerHTML = "대기 중";
  }
});
// 죽는 다고 할때
$('#die').click('submit', function(e){
  var roomMoney = (document.getElementById("roomMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  socket.emit('die_send', 1*roomMoneyNumber);
});
// 죽는 다고 할 때 반응하는 소켓
socket.on('die_receive', function(room, user){
  document.getElementById("roomAllMoney").innerHTML = room.roomAllMoney;
  var turn = document.getElementsByName("turn");
  var money = document.getElementsByName("money");
  var die = document.getElementsByName("dieState");
  for(var i = 0; i < room.connUsers.length; i++){
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].innerHTML = "현재 턴";
    else
      turn[i].innerHTML = "대기 중";
    if(user.userName == room.connUsers[i].userName){
      money[i].innerHTML = room.connUsers[i].money;
      die[i].innerHTML = "Die";
    }
    if(currentUserName == room.connUsers[i].userName && die[i].innerHTML == "Die"){
      $("#buttons").hide();
    }
  }
});
// call을 눌렀을때(지금까지 주어진 판돈만큼만 걸고 끝내기를 선언)
$('#call').click('submit', function(e){
  var roomMoney = (document.getElementById("roomMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  socket.emit('call_send', 1*roomMoneyNumber);
});
// half을 눌렀을때(판돈의 2배만큼을 건다.)
$('#half').click('submit', function(e){
  var roomMoney = (document.getElementById("roomMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  var money = 2*roomMoneyNumber;
  socket.emit('half_send', money);
});
// 콜의 대해 반응 하는 소켓
socket.on('call_receive', function(room, user){
  document.getElementById("roomAllMoney").innerHTML = room.roomAllMoney;
  var turn = document.getElementsByName("turn");
  var money = document.getElementsByName("money");
  var currentState = document.getElementsByName("currentState");
  for(var i = 0; i < room.connUsers.length; i++){
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].innerHTML = "현재 턴";
    else
      turn[i].innerHTML = "대기 중";
    if(user.userName == room.connUsers[i].userName){
      money[i].innerHTML = room.connUsers[i].money;
      currentState[i].innerHTML = "Call";
    }
  }
});
// 하프의 대해 반응 하는 소켓
socket.on('half_receive', function(room, user){
  document.getElementById("roomAllMoney").innerHTML = room.roomAllMoney;
  document.getElementById("roomMoney").innerHTML = room.roomMoney;
  var turn = document.getElementsByName("turn");
  var money = document.getElementsByName("money");
  var currentState = document.getElementsByName("currentState");
  for(var i = 0; i < room.connUsers.length; i++){
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].innerHTML = "현재 턴";
    else
      turn[i].innerHTML = "대기 중";
    if(user.userName == room.connUsers[i].userName){
      money[i].innerHTML = room.connUsers[i].money;
      currentState[i].innerHTML = "Half";
    }
  }
});
// 모두 콜을 눌렀을 때 한장씩 더 나눠주는 코드
socket.on('lastCardDistribution_receive', function(room, cards){
  var die = document.getElementsByName("dieState");
  var turn = document.getElementsByName("turn");
  var currentState = document.getElementsByName("currentState");
  for(var i = 0; i < room.connUsers.length; i++){
    if(currentUserName == room.connUsers[i].userName && die[i].innerHTML != "Die"){
      $("#secondButton").hide();
      $("#cardButton").show();
      $("#cardButton #card3").show();
      $("#cardButton #die").hide();
      $("#thirdButton").show();
      document.getElementById("card3").innerHTML = cards[2*room.connUsers.length+i];
      document.getElementById("cardImforamtion3").innerHTML = cards[2*room.connUsers.length+i];
    }
    currentState[i].innerHTML = '';
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].innerHTML = "현재 턴";
    else
      turn[i].innerHTML = "대기 중";
  }
  console.log(cards);
});

// window.onbeforeunload = function() {
//   socket.emit('leave_send');
//   return "gg";
// };
