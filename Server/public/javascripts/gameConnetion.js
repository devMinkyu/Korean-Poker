var socket = io.connect();
var element = document.getElementById("_id");
var currentUserName = document.getElementById("userName").innerHTML;
$("#dadang").attr('disabled',true);
$("#call").attr('disabled',true);
$("#half").attr('disabled',true);
$("#bbing").attr('disabled',true);
$("#check").attr('disabled',true);
$("#die").attr('disabled',true);


// 연결
socket.emit('room_connection_send', element.innerHTML-1, currentUserName);

socket.on('room_connection_receive', function(users){
  $('#userWindow').empty();
  var name = document.getElementsByName("username");
  var win = document.getElementsByName("win");
  var lose = document.getElementsByName("lose");
  var state = document.getElementsByName("state");
  var img = document.getElementsByName("userProfile");
  for(var i = 0; i < users.length; i++){
    $("#userWindow").append($('#rowTemplate1').html());
    name[i].innerHTML = users[i].userName;
    win[i].innerHTML = "승: " + users[i].win;
    lose[i].innerHTML = "/ 패: " + users[i].lose;
    img[i].src=users[i].photoURL;
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
  if(users[index].isReady === true){
    state[index].innerHTML = "준비 완료";
  }
  else{
    state[index].innerHTML = "대기 중";
  }
});
//게임 시작후 카드 뿌려주기
socket.on('start_game', function(room){
  $("#ready").attr('disabled',true);
  $("#exit").attr('disabled',true);
  $("#die").attr('disabled',false);
  socket.emit('timer_send');
  $('#userWindow').empty();
  for(var i = 0; i < room.connUsers.length; i++){
    $("#userWindow").append($('#rowTemplate3').html());
    $(".gamefield").append($('#rowTemplate2').html());
  }
  var money = document.getElementsByClassName("moneyBar");
  var img = document.getElementsByName("userProfile");
  var name = document.getElementsByName("username");
  var cardImforamtion1 = document.getElementById("cardImforamtion1");
  var cardImforamtion2 = document.getElementById("cardImforamtion2");
  var currentUserName = document.getElementById("userName").innerHTML;
  for(var i = 0; i < room.connUsers.length; i++){
    money[i].innerHTML = "돈: " + room.connUsers[i].money;
    name[i].innerHTML = room.connUsers[i].userName;
    img[i].src=room.connUsers[i].photoURL;
    if(currentUserName == room.connUsers[i].userName){
      var card1 = room.cards[2*i];
      var card2 = room.cards[2*i+1];
      cardImforamtion1.src ="/images/card/" + card1 +".png";
      cardImforamtion2.src ="/images/card/" + card2 +".png";
    }
  }
  cardAnimation(room.connUsers.length);
});
// 한장의 카드 눌렀을때
$('#cardImforamtion1').click(function(){
    if($('.mycards.image-selected').index() == -1){ 
        $('#cardImforamtion1').addClass("image-selected");
    }else {
        $('.mycards').removeClass("image-selected");
        $('#cardImforamtion1').addClass("image-selected");
    }
    oneSelect();
});
$('#cardImforamtion2').click(function(){
    if($('.mycards.image-selected').index() == -1){ 
        $('#cardImforamtion2').addClass("image-selected");
    }else {
        $('.mycards').removeClass("image-selected");
        $('#cardImforamtion2').addClass("image-selected");
    }
    oneSelect();
});
function oneSelect(){
  var cardImforamtion1 = document.getElementById("cardImforamtion1");
  var cardImforamtion2 = document.getElementById("cardImforamtion2");
  var selectCard;
  var card1 = cardImforamtion1.src;
  var card2 = cardImforamtion2.src;
  if(cardImforamtion1.getAttribute("class").indexOf("image-selected") == -1){
    selectCard = (card2.replace(/[^0-9]/g,"")).split("3000").join("");
  } else if(cardImforamtion2.getAttribute("class").indexOf("image-selected") == -1){
    selectCard = (card1.replace(/[^0-9]/g,"")).split("3000").join("");
  }
  socket.emit('one_open_card_send', 1*selectCard);
}
// 카드한장씩 공개
socket.on('one_open_card_receive', function(room, user){
  document.getElementById("roomAllMoney").innerHTML = '총 금액 : '+room.roomAllMoney +'원';
  var openCard = document.getElementsByClassName("cards");
  var turn = document.getElementsByClassName("turn");
  var money = document.getElementsByClassName("moneyBar");

  for(var i = 0; i < room.connUsers.length; i++){
    if(user.userName == room.connUsers[i].userName){
      openCard[i].src ="/images/card/" + user.cards[0] +".png";
      money[i].innerHTML = "돈: " + room.connUsers[i].money;
    }
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
  }
  $(".cards").transition({ 
      perspective: '100px',
      rotateY: '180deg'
  });
});
// 한장씩 다 공개했을때 반응하는 소켄
socket.on('one_open_card_end_receive',function(room){
  var die = document.getElementsByClassName("playerdie");
  var turn = document.getElementsByClassName("turn");
  for(var i = 0; i < room.connUsers.length; i++){
    if(currentUserName == room.connUsers[i].userName && die[i].innerHTML != "Die"){
      $("#dadang").attr('disabled',false);
      $("#call").attr('disabled',false);
      $("#half").attr('disabled',false);
      $("#bbing").attr('disabled',false);
      $("#check").attr('disabled',false);
    }
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
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
  var turn = document.getElementsByClassName("turn");
  var money = document.getElementsByClassName("moneyBar");
  var die = document.getElementsByClassName("playerdie");
  for(var i = 0; i < room.connUsers.length; i++){
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
    if(user.userName == room.connUsers[i].userName){
      money[i].innerHTML = "돈: " + room.connUsers[i].money;
      die[i].innerHTML = "Die";
    }
    if(currentUserName == room.connUsers[i].userName && die[i].innerHTML == "Die"){
      $("#dadang").attr('disabled',true);
      $("#call").attr('disabled',true);
      $("#half").attr('disabled',true);
      $("#bbing").attr('disabled',true);
      $("#check").attr('disabled',true);
      $("#die").attr('disabled',true);
    }
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
  }
});
// call을 눌렀을때(지금까지 주어진 배팅금만큼만 걸고 끝내기를 선언)
$('#call').click('submit', function gg(){
  var roomMoney = (document.getElementById("roomAllMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  socket.emit('call_send', 1*roomMoneyNumber);
});
// half을 눌렀을때(배팅금의 반만큼을 건다.)
$('#half').click('submit', function(){
  var roomMoney = (document.getElementById("roomAllMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  var money = 0.5*roomMoneyNumber;
  socket.emit('half_send', money);
});
// dadang을 눌렀을때(배팅금의 2배만큼을 건다.)
$('#dadang').click('submit', function(){
  var roomMoney = (document.getElementById("roomAllMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  var money = 2*roomMoneyNumber;
  socket.emit('dadang_send', money);
});
// bbing을 눌렀을때(판돈만큼을 건다.)
$('#bbing').click('submit', function(){
  var roomMoney = (document.getElementById("roomMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  var money = 1*roomMoneyNumber;
  socket.emit('bbing_send', money);
});
// bbing을 눌렀을때 돈을 안걸고 그냥 턴을 넘긴다. 그리고 그냥 끝내기를 선언
$('#check').click('submit', function(){
  socket.emit('check_send');
});
// 배팅의 대해 반응 하는 소켓
socket.on('betting_receive', function(room, user, state){
  document.getElementById("roomAllMoney").innerHTML = room.roomAllMoney;
  var turn = document.getElementsByClassName("turn");
  var money = document.getElementsByClassName("moneyBar");
  var playerBettingState = document.getElementsByClassName("playerBettingState");
  for(var i = 0; i < room.connUsers.length; i++){
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
    if(user.userName == room.connUsers[i].userName){
      money[i].innerHTML = "돈: " + room.connUsers[i].money;
      playerBettingState[i].innerHTML = state;
    }
  }
});
// 모두 콜을 눌렀을 때 한장씩 더 나눠주는 코드
socket.on('lastCardDistribution_receive', function(room){
  var cardImforamtion3 = document.getElementById("cardImforamtion3");
  var die = document.getElementsByClassName("playerdie");
  var turn = document.getElementsByClassName("turn");
  var playerBettingState = document.getElementsByClassName("playerBettingState");
  for(var i = 0; i < room.connUsers.length; i++){
    $(".gamefield").append($('#rowTemplate4').html());
  }
  for(var i = 0; i < room.connUsers.length; i++){
    if(currentUserName == room.connUsers[i].userName && die[i].innerHTML != "Die"){
      $("#dadang").attr('disabled',true);
      $("#call").attr('disabled',true);
      $("#half").attr('disabled',true);
      $("#bbing").attr('disabled',true);
      $("#check").attr('disabled',true);
      $("#die").attr('disabled',true);
      cardImforamtion3.src ="/images/card/" + room.cards[2*room.connUsers.length+i] +".png";
    }
    playerBettingState[i].innerHTML = '';
    if(room.connUsers[i].userName == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
  }
  cardAnimationThird(room.connUsers.length);
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
socket.on('resetGame_receive', function(cards, user){

});
socket.on('gameContinueCheck_receive', function(room, user){
  document.getElementById("roomAllMoney").innerHTML = room.roomAllMoney;
  var money = document.getElementsByName("money");
  for(var i = 0; i < room.connUsers.length; i++){
    if(user.userName == room.connUsers[i].userName){
      money[i].innerHTML = room.connUsers[i].money;
    }
  }
  // 한 컴퓨터에서 로컬을 많이 키고 하면 안되는지만 다른 컴퓨터로 접속 하면 된다.
  var continueCheck = confirm("게임을 계속 진행 하시겠습니까?");
  socket.emit('gameContinueCheck_send', continueCheck);
});

// window.onbeforeunload = function() {
//   socket.emit('leave_send');
//   return "gg";
// };
socket.on('timer_receive', function(timer){
  document.getElementById("viewTimer").innerHTML = timer;
});

function cardAnimation(userNumber){
    var direction = {left: "+=75%", bottom: "+=20%"}
    var directionCount = 0 //주는 카드 방향 지정
    var moveLeftCount = 0 // 받는 카드를 세장씩 정렬
    
    var drawCards = $('.cards').each(function(index) {
      $(this).delay(300*index).animate(direction)
      if(directionCount == 0){
          if(moveLeftCount == 0 ){// 2번 플레이어
              direction = {left: "+=75%", bottom: "-=40%"}
              directionCount++
          }else if(moveLeftCount ==1){
              direction = {left: "+=65%", bottom: "-=40%"}
              directionCount++
          }
      }else if(directionCount == 1 && userNumber > 2){ //3번 플레이어
          if(moveLeftCount == 0 ){
              direction = {left: "-=65%", bottom: "-=40%"}
              directionCount++
          }else if(moveLeftCount ==1){
              direction = {left: "-=55%", bottom: "-=40%"}
              directionCount++
          }
      }else if(directionCount == 2  && userNumber > 3){//4번 플레이어
          if(moveLeftCount == 0 ){
              direction = {left: "-=65%", bottom: "+=20%"}
              directionCount++
          }else if(moveLeftCount ==1){
              direction = {left: "-=55%", bottom: "+=20%"}  
              directionCount++
          }
      }
      else{//1번 플레이어
          if(moveLeftCount == 0 ){
              direction = {left: "+=65%", bottom: "+=20%"}
              directionCount = 0
              moveLeftCount++
          }
      }
    });

    $.when(drawCards).then(function (){
        $(".moneypanel").fadeIn();
        $(".cards").transition({ 
            perspective: '100px',
            rotateY: '180deg'
        });
    });

    $.when(drawCards).then(function (){
         $(".mycards").fadeIn();
          var myCardsDirection = 0
          var myCardsDirectionCounter = 0;
            var checkMyCards = $('.mycards').each(function(index) {
                $(this).delay(10*index).animate(myCardsDirection);
                if(myCardsDirectionCounter == 0 ){
                    myCardsDirection = {left: "+=8%"}
                    myCardsDirectionCounter++
                }else if(myCardsDirectionCounter ==1){
                    myCardsDirection = {left: "+=16%"}
                }
            });
            $.when(checkMyCards).then(function (){
                $(".mycards").transition({ 
                    perspective: '100px',
                    rotateY: '180deg'
                });
            });
        });
    }

function cardAnimationThird(userNumber){
  var direction = {left: "+=55%", bottom: "+=20%"}
  var directionCount = 0 //주는 카드 방향 지정
  var drawCards = $('.lastCards').each(function(index) {
    $(this).delay(300*index).animate(direction)
    if(directionCount == 0){
        direction = {left: "+=55%", bottom: "-=40%"}
        directionCount++
    }else if(directionCount == 1 && userNumber > 2){ //3번 플레이어
        direction = {left: "-=45%", bottom: "-=40%"}
        directionCount++
    }else if(directionCount == 2 && userNumber > 3){//4번 플레이어
        direction = {left: "-=45%", bottom: "+=10%"}
        directionCount++
    }
  });
}
