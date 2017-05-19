var socket = io.connect();
var element = document.getElementById("_id");
var currentUserName = document.getElementById("userName").innerHTML;
$("#secondButton").hide();
$("#thirdButton").hide();
$("#cardImforamtion").hide();

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
  // socket.emit("timer_send"); 한번만 실행 되게끔 하자.
  $("#cardImforamtion").show();
  $("#thirdButton").show();
  $("#cardImforamtion #card3").hide();
  $("#cardImforamtion #cardImforamtion3").hide();
  $("#thirdButton #finallySelect").hide();
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
      $('#card2').val(cards[2*j+1]);
      document.getElementById("cardImforamtion1").innerHTML = cards[2*j] + " ";
      document.getElementById("cardImforamtion2").innerHTML = cards[2*j+1] + " ";
    }
    money[j].innerHTML = "금액: " + room.connUsers[j].money;
    if(room.currentTurnUser == room.connUsers[j].userName)
      turn[j].innerHTML = "현재 턴";
    else
      turn[j].innerHTML = "대기 중";
  }
});
// 한장의 카드 눌렀을때
$('#firstSelect').click('submit', function(e){
  var card = document.getElementsByName("card");
  var selectCard = null;
  var checkCount = 0;
  for(var i = 0; i < card.length; i++){
    if(card[i].checked){
      card[i].checked = false;
      selectCard = card[i].value;
      checkCount++;
    }
  }
  if(checkCount > 1){
    alert("한장만 선택하세요!!");
    return;
  }
  var roomMoney = (document.getElementById("roomMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  socket.emit('one_open_card_send', selectCard, 1*roomMoneyNumber);
});
// 카드한장을 눌렀을 때 반응하는 소켓
socket.on('one_open_card_receive', function(card, room, user){
  document.getElementById("roomAllMoney").innerHTML = room.roomAllMoney;
  var openCard = document.getElementsByName("opencard1");
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
      $("#thirdButton").hide();
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
  var roomMoney = (document.getElementById("roomAllMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  socket.emit('call_send', 1*roomMoneyNumber);
});
// half을 눌렀을때(판돈의 2배만큼을 건다.)
$('#half').click('submit', function(e){
  var roomMoney = (document.getElementById("roomAllMoney").innerHTML);
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
      $("#thirdButton").show();
      $("#thirdButton #die").hide();
      $("#thirdButton #firstSelect").hide();
      $("#thirdButton #finallySelect").show();
      $("#cardImforamtion #card3").show();
      $("#cardImforamtion #cardImforamtion3").show();
      $('#card3').val(cards[2*room.connUsers.length+i]);
      document.getElementById("cardImforamtion3").innerHTML = cards[2*room.connUsers.length+i];
    }
    currentState[i].innerHTML = '';
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].innerHTML = "현재 턴";
    else
      turn[i].innerHTML = "대기 중";
  }
});
$('#finallySelect').click('submit', function(e){
  var card = document.getElementsByName("card");
  var selectCard = [];
  var checkCount = 0;
  for(var i = 0; i < card.length; i++){
    if(card[i].checked){
      card[i].checked = false;
      selectCard.push(card[i].value);
      checkCount++;
    }
  }
  if(checkCount > 2){
    alert("두장만 선택하세요!!");
    return;
  }
  socket.emit('finallySelect_send', selectCard);
});
socket.on('finallySelect_receive', function(cards, room, user){
  document.getElementById("roomAllMoney").innerHTML = room.roomAllMoney;
  var openCard1 = document.getElementsByName("opencard1");
  var openCard2 = document.getElementsByName("opencard2");
  var turn = document.getElementsByName("turn");
  var currentState = document.getElementsByName("currentState");
  for(var i = 0; i < room.connUsers.length; i++){
    if(user.userName == room.connUsers[i].userName){
      openCard1[i].innerHTML = cards[0];
      openCard2[i].innerHTML = cards[1];
    }
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].innerHTML = "현재 턴";
    else
      turn[i].innerHTML = "대기 중";
  }
});
// window.onbeforeunload = function() {
//   socket.emit('leave_send');
//   return "gg";
// };
socket.on('timer_receive', function(room){
  document.getElementById("viewTimer").innerHTML = room.timer;
});
