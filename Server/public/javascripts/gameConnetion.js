var socket = io.connect();
var element = document.getElementById("_id");
var currentUserID = document.getElementById("userID").innerHTML;
var cards=[];

// 연결
socket.emit('room_connection_send', element.innerHTML-1, currentUserID);

socket.on('room_connection_receive', function(users){
  $('#userWindow').empty();
  $("#ready").attr('disabled',false);
  $("#dadang").attr('disabled',true);
  $("#call").attr('disabled',true);
  $("#half").attr('disabled',true);
  $("#bbing").attr('disabled',true);
  $("#check").attr('disabled',true);
  $("#die").attr('disabled',true);
  var name = document.getElementsByName("username");
  var win = document.getElementsByName("win");
  var lose = document.getElementsByName("lose");
  var state = document.getElementsByName("state");
  var img = document.getElementsByName("userProfile");
  var money = document.getElementsByClassName("moneyBar");
  for(var i = 0; i < users.length; i++){
    $("#userWindow").append($('#rowTemplate1').html());
    name[i].innerHTML = users[i].userName;
    win[i].innerHTML = "승: " + users[i].win;
    lose[i].innerHTML = "/ 패: " + users[i].lose;
    money[i].innerHTML = "돈: " + users[i].money;
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
window.onbeforeunload = function() {
  socket.emit('leave_send');
};
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
  $("#die").attr('disabled',false);
  $("#myCardWindow").append($('#rowTemplate6').html());
  socket.emit('timer_send');
  $('#userWindow').empty();
  for(var i = 0; i < room.connUsers.length; i++){
    $("#userWindow").append($('#rowTemplate3').html());
    $(".cardBundle").append($('#rowTemplate2').html());
  }
  var money = document.getElementsByClassName("moneyBar");
  var img = document.getElementsByName("userProfile");
  var name = document.getElementsByName("username");
  var cardImforamtion1 = document.getElementById("cardImforamtion1");
  var cardImforamtion2 = document.getElementById("cardImforamtion2");
  for(var i = 0; i < room.connUsers.length; i++){
    money[i].innerHTML = "돈: " + room.connUsers[i].money;
    name[i].innerHTML = room.connUsers[i].userName;
    img[i].src=room.connUsers[i].photoURL;
    if(currentUserID == room.connUsers[i].userID){
      cards[0] = room.cards[2*i];
      cards[1] = room.cards[2*i+1];
      cardImforamtion1.src ="/images/card/" + cards[0] +".png";
      cardImforamtion2.src ="/images/card/" + cards[1] +".png";
      socket.emit('one_open_card_send', cards[0]);
    }
  }
  cardAnimation(room.connUsers.length);
});
// 한장의 카드 눌렀을때
function firstCardSelect1(){
  if($('.mycards.image-selected').index() == -1){ 
      $('#cardImforamtion1').addClass("image-selected");
  }else {
      $('.mycards').removeClass("image-selected");
      $('#cardImforamtion1').addClass("image-selected");
  }
  oneSelect();
}
function firstCardSelect2(){
  if($('.mycards.image-selected').index() == -1){ 
      $('#cardImforamtion2').addClass("image-selected");
  }else {
      $('.mycards').removeClass("image-selected");
      $('#cardImforamtion2').addClass("image-selected");
  }
  oneSelect();
}
function oneSelect(){
  var selectCard;
  if(cardImforamtion1.getAttribute("class").indexOf("image-selected") == -1){
    selectCard = cards[1];
  } else if(cardImforamtion2.getAttribute("class").indexOf("image-selected") == -1){
    selectCard = cards[0];
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
    if(user.userID == room.connUsers[i].userID){
      openCard[i].src ="/images/card/" + user.cards[0] +".png";
      money[i].innerHTML = "돈: " + room.connUsers[i].money;
    }
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
  }
  // $(".cards").transition({ 
  //     perspective: '100px',
  //     rotateY: '180deg'
  // });
});
// 한장씩 다 공개했을때 반응하는 소켄
socket.on('one_open_card_end_receive',function(room){
  var die = document.getElementsByClassName("playerdie");
  var turn = document.getElementsByClassName("turn");
  for(var i = 0; i < room.connUsers.length; i++){
    if(currentUserID == room.connUsers[i].userID && die[i].innerHTML != "Die"){
      $("#dadang").attr('disabled',false);
      $("#call").attr('disabled',false);
      $("#half").attr('disabled',false);
      $("#bbing").attr('disabled',false);
      $("#check").attr('disabled',false);
    }
    if(room.connUsers[i].userID == room.currentTurnUser)
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
  document.getElementById("roomAllMoney").innerHTML = '총 금액 : '+room.roomAllMoney +'원';
  var turn = document.getElementsByClassName("turn");
  var money = document.getElementsByClassName("moneyBar");
  var die = document.getElementsByClassName("playerdie");
  for(var i = 0; i < room.connUsers.length; i++){
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
    if(user.userID == room.connUsers[i].userID){
      money[i].innerHTML = "돈: " + room.connUsers[i].money;
      die[i].innerHTML = "Die";
    }
    if(currentUserID == room.connUsers[i].userID && die[i].innerHTML == "Die"){
      $("#dadang").attr('disabled',true);
      $("#call").attr('disabled',true);
      $("#half").attr('disabled',true);
      $("#bbing").attr('disabled',true);
      $("#check").attr('disabled',true);
      $("#die").attr('disabled',true);
      $('#myCardWindow').empty();
    }
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
  }
});
// call을 눌렀을때(지금까지 주어진 배팅금만큼만 걸고 끝내기를 선언)
$('#call').click('submit', function (){
  var roomMoney = (document.getElementById("roomAllMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  socket.emit('call_send', 1*roomMoneyNumber);
});
// half을 눌렀을때(배팅금만큼 건다.)
$('#half').click('submit', function(){
  var roomMoney = (document.getElementById("roomAllMoney").innerHTML);
  var roomMoneyNumber = roomMoney.replace(/[^0-9]/g,"");
  var money = 1*roomMoneyNumber;
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
  document.getElementById("roomAllMoney").innerHTML = '총 금액 : '+room.roomAllMoney +'원';
  var turn = document.getElementsByClassName("turn");
  var money = document.getElementsByClassName("moneyBar");
  var playerBettingState = document.getElementsByClassName("playerBettingState");
  for(var i = 0; i < room.connUsers.length; i++){
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
    if(user.userID == room.connUsers[i].userID){
      money[i].innerHTML = "돈: " + room.connUsers[i].money;
      playerBettingState[i].innerHTML = state;
    }
  }
});
// 모두 콜을 눌렀을 때 한장씩 더 나눠주는 코드
socket.on('lastCardDistribution_receive', function(room){
  var cardImforamtion1 = document.getElementById("cardImforamtion1");
  var cardImforamtion2 = document.getElementById("cardImforamtion2");
  var die = document.getElementsByClassName("playerdie");
  var turn = document.getElementsByClassName("turn");
  var playerBettingState = document.getElementsByClassName("playerBettingState");
  $('#myCardWindow').empty();
  var card1 = document.getElementsByClassName("card1");
  var card2 = document.getElementsByClassName("card2");
  var card3 = document.getElementsByClassName("card3");
  for(var i = 0; i < room.connUsers.length; i++){
    $(".cardBundle").append($('#rowTemplate4').html());
  }
  for(var i = 0; i < room.connUsers.length; i++){
    if(currentUserID == room.connUsers[i].userID && die[i].innerHTML != "Die"){
      $("#myCardWindow").append($('#rowTemplate5').html());
      $("#dadang").attr('disabled',true);
      $("#call").attr('disabled',true);
      $("#half").attr('disabled',true);
      $("#bbing").attr('disabled',true);
      $("#check").attr('disabled',true);
      $(".card1").attr("src", cardImforamtion1.src);
      $(".card2").attr("src", cardImforamtion2.src);
      $(".card3").attr("src", "/images/card/" + room.cards[2*room.connUsers.length+i] +".png");
      cards[2] = room.cards[2*room.connUsers.length+i];
      socket.emit('twoCardAutoSelect', [cards[0],cards[1]]);
    }
    playerBettingState[i].innerHTML = '';
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
  }
  cardAnimationThird(room.connUsers.length);
});
// 두장씩 선택하는거
function select1 (){
  var selectCard = [];
  selectCard[0] = cards[0];
  selectCard[1] = cards[1];
  socket.emit('finallySelect_send', selectCard);
}
function select2 (){
  var card1 = document.getElementsByClassName("card1")
  var selectCard = [];
  selectCard[0] = cards[0];
  selectCard[1] = cards[2];  
  socket.emit('finallySelect_send', selectCard);
}
function select3 (){
  var selectCard = [];
  selectCard[0] = cards[1];
  selectCard[1] = cards[2];
  socket.emit('finallySelect_send', selectCard);  
}
socket.on('cardButtonEmpty_receive', function(){
  $("#myCardWindow").empty();
})
socket.on('finallySelect_receive', function(cards, room, user){
  var openCard = document.getElementsByClassName("cards");
  var turn = document.getElementsByClassName("turn");
  for(var i = 0; i < room.connUsers.length; i++){
    if(user.userID == room.connUsers[i].userID){
      openCard[i].src= "/images/card/" + cards[0] +".png";
      openCard[i+room.connUsers.length].src = "/images/card/" + cards[1] +".png";
    }
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
  }
});
socket.on('resetGame_receive', function(room){
  var die = document.getElementsByClassName("playerdie");
  var selectCard = [];
  $('#myCardWindow').empty();
  $('.cards').remove();
  $('.lastCards').remove();
  $("#myCardWindow").append($('#rowTemplate6').html());
  for(var i = 0; i < room.connUsers.length; i++){
    $(".cardBundle").append($('#rowTemplate2').html());  
  }
  var openCard = document.getElementsByClassName("cards");
  for(var i = 0; i < room.connUsers.length; i++){
    if(currentUserID == room.connUsers[i].userID && die[i].innerHTML != "Die"){
      $("#cardImforamtion1").attr("src", "/images/card/" + room.cards[2*i] +".png");
      $("#cardImforamtion2").attr("src", "/images/card/" + room.cards[2*i+1] +".png");
      selectCard[0] = room.cards[2*i];
      selectCard[1] = room.cards[2*i+1];
      socket.emit('finallySelect_send', selectCard); 
    }
    for(var j = 0; j<room.gamingUsers.length; j++){
      if(room.gamingUsers[j].userID == room.connUsers[i].userID){
        openCard[i].src = "/images/card/" + room.cards[2*i] +".png";
        openCard[i+room.connUsers.length].src = "/images/card/" + room.cards[2*i+1] +".png";
        break;
      }
    } 
  }
  cardAnimation(room.connUsers.length);
});
socket.on('gameContinueCheck_receive', function(room, user){
  document.getElementById("roomAllMoney").innerHTML = '총 금액 : '+room.roomAllMoney +'원';
  var money = document.getElementsByClassName("moneyBar");
  var myWin = document.getElementById("myWin");
  var myLose = document.getElementById("myLose");
  var Cards = document.getElementsByClassName("cards");
  $('#myCardWindow').empty();
  $('.cards').remove();
  $('.lastCards').remove();
  for(var i = 0; i < room.connUsers.length; i++){
    if(user.userID == room.connUsers[i].userID){
      money[i].innerHTML = "돈: " + room.connUsers[i].money;
    }
    if(currentUserID == room.connUsers[i].userID){
      myWin.innerHTML = " 승: " + room.connUsers[i].win;
      myLose.innerHTML = " / 패: " + room.connUsers[i].lose;
    }
  }
  // 한 컴퓨터에서 로컬을 많이 키고 하면 안되는지만 다른 컴퓨터로 접속 하면 된다.
  var continueCheck = confirm("게임을 계속 진행 하시겠습니까?");
  socket.emit('gameContinueCheck_send', continueCheck);
});

socket.on('timer_receive', function(timer){
  document.getElementById("viewTimer").innerHTML = timer;
});

function cardAnimation(userNumber){
    var direction = {left: "+=70%", bottom: "+=9%"}
    var directionCount = 0 //주는 카드 방향 지정
    var moveLeftCount = 0 // 받는 카드를 세장씩 정렬
    
    var drawCards = $('.cards').each(function(index) {
      $(this).delay(300*index).animate(direction)
      if(directionCount == 0){
          if(moveLeftCount == 0 ){// 2번 플레이어
              direction = {left: "+=70%", bottom: "-=53%"}
              directionCount++
          }else if(moveLeftCount ==1){
              direction = {left: "+=60%", bottom: "-=53%"}
              directionCount++
          }
      }else if(directionCount == 1 && userNumber > 2){ //3번 플레이어
          if(moveLeftCount == 0 ){
              direction = {left: "-=60%", bottom: "-=53%"}
              directionCount++
          }else if(moveLeftCount ==1){
              direction = {left: "-=50%", bottom: "-=53%"}
              directionCount++
          }
      }else if(directionCount == 2  && userNumber > 3){//4번 플레이어
          if(moveLeftCount == 0 ){
              direction = {left: "-=60%", bottom: "+=9%"}
              directionCount++
          }else if(moveLeftCount ==1){
              direction = {left: "-=50%", bottom: "+=9%"}  
              directionCount++
          }
      }
      else{//1번 플레이어
          if(moveLeftCount == 0 ){
              direction = {left: "+=60%", bottom: "+=9%"}
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
  var direction = {left: "+=50%", bottom: "+=0%"}
  var directionCount = 0 //주는 카드 방향 지정
  var drawCards = $('.lastCards').each(function(index) {
    $(this).delay(300*index).animate(direction)
    if(directionCount == 0){
        direction = {left: "+=50%", bottom: "-=62%"}
        directionCount++
    }else if(directionCount == 1 && userNumber > 2){ //3번 플레이어
        direction = {left: "-=40%", bottom: "-=62%"}
        directionCount++
    }else if(directionCount == 2 && userNumber > 3){//4번 플레이어
        direction = {left: "-=40%", bottom: "+=0%"}
        directionCount++
    }
  });
}
history.pushState(null, null, location.href); 
window.onpopstate = function(event) { 
  history.go(1); 
}