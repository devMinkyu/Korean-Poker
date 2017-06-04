var socket = io.connect();
var element = document.getElementById("_id");
var currentUserID = document.getElementById("userID").innerHTML;
var cards=[];
var count = 0;
var bettingMoneyImg = ['/images/moneys/1.png', '/images/moneys/2.png', '/images/moneys/3.png', '/images/moneys/4.png','/images/moneys/5.png','/images/moneys/6.png']
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
  var insignia = document.getElementsByClassName("insignia");
  var koreanMoney
  for(var i = 0; i < users.length; i++){
    koreanMoney = viewKoreanMoney(users[i].money);
    $("#userWindow").append($('#initialView').html());
    name[i].innerHTML = users[i].userName;
    win[i].innerHTML = "승: " + users[i].win;
    lose[i].innerHTML = "/ 패: " + users[i].lose;
    money[i].innerHTML = "돈: " + koreanMoney;
    img[i].src=users[i].photoURL;
    insignia[i].src='/images/insignia/' + users[i].insignia + '.png'
    var ready = i +1;
    if(users[i].isReady === true)
      $('.ready-game'+ready).transition({ opacity: 1 });
    else
      $('.ready-game'+ready).transition({ opacity: 0 });
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
    $('#chatLog').scrollTop(count);
    count += 50;
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
  var ready = index +1;
  if(users[index].isReady === true){
    $('.ready-game'+ready).transition({ opacity: 1 });
  }
  else{
    $('.ready-game'+ready).transition({ opacity: 0});
  }
});
//게임 시작후 카드 뿌려주기
socket.on('start_game', function(room){
  $("#ready").attr('disabled',true);
  $("#die").attr('disabled',false);
  $("#myCardWindow").append($('#privateViewCard').html());
  socket.emit('timer_send');
  $('#userWindow').empty();
  var money = document.getElementsByClassName("moneyBar");
  var img = document.getElementsByName("userProfile");
  var insignia = document.getElementsByClassName("insignia");
  var name = document.getElementsByName("username");
  var cardImforamtion1 = document.getElementById("cardImforamtion1");
  var cardImforamtion2 = document.getElementById("cardImforamtion2");
  var koreanMoney;
  for(var i = 0; i < room.connUsers.length; i++){
    koreanMoney = viewKoreanMoney(room.connUsers[i].money);
    $("#userWindow").append($('#gameView').html());
    $(".cardBundle").append($('#publicViewCard').html());
    money[i].innerHTML = "돈: " + koreanMoney;
    name[i].innerHTML = room.connUsers[i].userName;
    img[i].src=room.connUsers[i].photoURL;
    insignia[i].src='/images/insignia/' + room.connUsers[i].insignia + '.png'
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
  document.getElementById("roomAllMoney").innerHTML = '총 금액 : '+ viewKoreanMoney(room.roomAllMoney);
  var openCard = document.getElementsByClassName("cards");
  var turn = document.getElementsByClassName("turn");
  var money = document.getElementsByClassName("moneyBar");
  var bettingMoney;
  var koreanMoney;
  for(var i = 0; i < room.connUsers.length; i++){
    if(user.userID == room.connUsers[i].userID){
      $(".parentMoney").append($('#bettingMoneyView' + (i+1)).html());
      bettingMoney = document.getElementsByClassName("bettingMoney" + (i+1));
      bettingMoney[bettingMoney.length-1].src = bettingMoneyImg[i];
      koreanMoney = viewKoreanMoney(room.connUsers[i].money);
      openCard[i].src ="/images/card/" + user.cards[0] +".png";
      money[i].innerHTML = "돈: " + koreanMoney;
      firstBetting(i);
    }
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
  }
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
  socket.emit('die_send');
});
// 죽는 다고 할 때 반응하는 소켓
socket.on('die_receive', function(room, user){
  document.getElementById("roomAllMoney").innerHTML = '총 금액 : '+ viewKoreanMoney(room.roomAllMoney);
  var turn = document.getElementsByClassName("turn");
  var money = document.getElementsByClassName("moneyBar");
  var die = document.getElementsByClassName("playerdie");
  var koreanMoney;
  var bettingMoney;
  for(var i = 0; i < room.connUsers.length; i++){
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
    if(user.userID == room.connUsers[i].userID){
      $(".parentMoney").append($('#bettingMoneyView' + (i+1)).html());
      bettingMoney = document.getElementsByClassName("bettingMoney" + (i+1));
      bettingMoney[bettingMoney.length-1].src = bettingMoneyImg[(i+1)%6];
      koreanMoney = viewKoreanMoney(room.connUsers[i].money);
      money[i].innerHTML = "돈: " + koreanMoney;
      die[i].innerHTML = "Die";
      firstBetting(i);
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
  socket.emit('call_send');
});
// half을 눌렀을때(배팅금만큼 건다.)
$('#half').click('submit', function(){
  socket.emit('half_send');
});
// dadang을 눌렀을때(배팅금의 2배만큼을 건다.)
$('#dadang').click('submit', function(){
  socket.emit('dadang_send');
});
// bbing을 눌렀을때(판돈만큼을 건다.)
$('#bbing').click('submit', function(){
  socket.emit('bbing_send');
});
// check을 눌렀을때 돈을 안걸고 그냥 턴을 넘긴다. 그리고 그냥 끝내기를 선언
$('#check').click('submit', function(){
  socket.emit('check_send');
});
// 배팅의 대해 반응 하는 소켓
var bettingImgCount = 0;
socket.on('betting_receive', function(room, user, state){
  document.getElementById("roomAllMoney").innerHTML = '총 금액 : '+ viewKoreanMoney(room.roomAllMoney);
  var turn = document.getElementsByClassName("turn");
  var money = document.getElementsByClassName("moneyBar");
  var playerBettingState = document.getElementsByClassName("playerBettingState");
  var koreanMoney;
  var bettingMoney;
  for(var i = 0; i < room.connUsers.length; i++){
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
    if(user.userID == room.connUsers[i].userID){
      $(".parentMoney").append($('#bettingMoneyView' + (i+1)).html());
      bettingMoney = document.getElementsByClassName("bettingMoney" + (i+1));
      bettingMoney[bettingMoney.length-1].src = bettingMoneyImg[(i+bettingImgCount)%6];
      koreanMoney = viewKoreanMoney(room.connUsers[i].money);
      money[i].innerHTML = "돈: " + koreanMoney;
      playerBettingState[i].innerHTML = state;
      firstBetting(i);
    }
  }
  bettingImgCount++
});
// 모두 콜을 눌렀을 때 한장씩 더 나눠주는 코드
socket.on('lastCardDistribution_receive', function(room){
  var die = document.getElementsByClassName("playerdie");
  var turn = document.getElementsByClassName("turn");
  var playerBettingState = document.getElementsByClassName("playerBettingState");
  $('#myCardWindow').empty();
  for(var i = 0; i < room.connUsers.length; i++){
    $(".cardBundle").append($('#publicViewLastCard').html());
    if(currentUserID == room.connUsers[i].userID && die[i].innerHTML != "Die"){
      cards[2] = room.cards[2*room.connUsers.length+i];
      socket.emit('twoCardAutoSelect', [cards[0],cards[1]]);
      $("#myCardWindow").append($('#privateViewLastCard').html());
      var cardImforamtion1 = document.getElementById("cardImforamtion1");
      var cardImforamtion2 = document.getElementById("cardImforamtion2");
      var cardImforamtion3 = document.getElementById("cardImforamtion3");
      cardImforamtion1.src ="/images/card/" + cards[0] +".png";
      cardImforamtion2.src ="/images/card/" + cards[1] +".png";
      cardImforamtion3.src ="/images/card/" + cards[2] +".png";
    }
    playerBettingState[i].innerHTML = '';
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = "";
  }
  cardAnimationThird(room.connUsers.length);
});
// 카드 나눠준 후 다 콜 했을 때 두장 선택하게끔 만드는 코드
socket.on('lastSelect_receive', function(room){
  var die = document.getElementsByClassName("playerdie");
  var turn = document.getElementsByClassName("turn");
  var playerBettingState = document.getElementsByClassName("playerBettingState");
  $('#myCardWindow').empty();
  var card1 = document.getElementsByClassName("card1");
  var card2 = document.getElementsByClassName("card2");
  var card3 = document.getElementsByClassName("card3");
  for(var i = 0; i < room.connUsers.length; i++){
    if(currentUserID == room.connUsers[i].userID && die[i].innerHTML != "Die"){
      $("#myCardWindow").append($('#privateViewCardSelect').html());
      $("#dadang").attr('disabled',true);
      $("#call").attr('disabled',true);
      $("#half").attr('disabled',true);
      $("#bbing").attr('disabled',true);
      $("#check").attr('disabled',true);
      $(".card1").attr("src", "/images/card/" + cards[0] +".png");
      $(".card2").attr("src", "/images/card/" + cards[1] +".png");
      $(".card3").attr("src", "/images/card/" + cards[2] +".png");
    }
    playerBettingState[i].innerHTML = '';
    if(room.connUsers[i].userID == room.currentTurnUser)
      turn[i].src="/images/turn.png";
    else
      turn[i].src = ""; 
  }
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
  $("#myCardWindow").append($('#privateViewCard').html());
  for(var i = 0; i < room.connUsers.length; i++){
    $(".cardBundle").append($('#publicViewCard').html());  
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
  document.getElementById("roomAllMoney").innerHTML = '총 금액 : '+viewKoreanMoney(room.roomAllMoney) ;
  var money = document.getElementsByClassName("moneyBar");
  var myWin = document.getElementById("myWin");
  var myLose = document.getElementById("myLose");
  var Cards = document.getElementsByClassName("cards");
  var koreanMoney;
  $('#myCardWindow').empty();
  $('.cards').remove();
  $('.lastCards').remove();
  for(var i = 0; i < room.connUsers.length; i++){
    if(user.userID == room.connUsers[i].userID){
      koreanMoney = viewKoreanMoney(room.connUsers[i].money);
      money[i].innerHTML = "돈: " + koreanMoney;
      combineMoney(i+1);
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


history.pushState(null, null, location.href); 
window.onpopstate = function(event) { 
  history.go(1); 
}

function viewKoreanMoney(money) {	
    var danA = new Array("","십","백","천","","십","백","천","","십","백","천","","십","백","천");
    var result = "";
    var num = money.toString();
	for(i=0; i<num.length; i++) {		
		str = "";
		han = num.charAt(num.length-(i+1))
		if(han != 0)
			str += han+danA[i];
		if(i == 4) str += "만";
		if(i == 8) str += "억";
		if(i == 12) str += "조";
		result = str + result;
	}
	if(num != 0){
		result = result + "원";
    return result ;
  } else{
    return "0원";
  }
}
