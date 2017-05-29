var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var configAuth = require('./config/auth');
var index = require('./routes/index');
var user = require('./routes/user');
var game = require('./routes/game');
var routeAuth = require('./routes/auth');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var favicon = require('serve-favicon');
var flash = require('connect-flash');
var _ = require('underscore');


var User = require('./models/User');
var app = express();
app.io = require('socket.io')();


// app.use(favicon(__dirname + '/public/images/logos/favicon.ico'));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.locals.moment = require('moment');
// mongodb connect
mongoose.connect('mongodb://localhost:9336/koreanpoker');
mongoose.connection.on('error', console.log);

app.io.on('connection', function(socket){
  console.log('user conneected: ', socket.id);

  socket.on('room_connection_send', function(_id, currentUserID){
    socket.join(_id);
    // socket._id 는 room 배열의 인덱스
    socket._id = _id;
    socket.userID = currentUserID;
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, {userID: socket.userID});
    console.log("**********Room ID*************");
    console.log(socket._id);
    console.log("***************************");
    var message = rooms[roomIndex].connUsers[userIndex].userName + " 님이 입장하셨습니다.";
    app.io.sockets.in(socket._id).emit('message_receive', message);
    app.io.sockets.in(socket._id).emit('room_connection_receive', rooms[roomIndex].connUsers);
  });
  // 방에 들어온 인원들만 메세지를 주고 받을 수 있다.
  socket.on('message_send', function(text){
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, {userID: socket.userID});
    var message = rooms[roomIndex].connUsers[userIndex].userName + ':' + text;
    app.io.sockets.in(socket._id).emit('message_receive', message);
  });

  socket.on('ready_send', function(){
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, {userID: socket.userID});
    if(rooms[roomIndex].connUsers[userIndex].isReady === false){
      rooms[roomIndex].connUsers[userIndex].isReady = true;
      var ReadyCheckIndex = _.findIndex(rooms[roomIndex].connUsers, { isReady: false });
      // 레디를 다 하고 2명 이상일떄
      if(ReadyCheckIndex == -1 && rooms[roomIndex].connUsers.length == rooms[roomIndex].roomUserNumber){
        rooms[roomIndex].state = "게임중";
        gameStart(roomIndex, socket._id);
        return;
      }
    }else if(rooms[roomIndex].connUsers[userIndex].isReady === true){
      rooms[roomIndex].connUsers[userIndex].isReady = false;
    }
    app.io.sockets.in(socket._id).emit('ready_receive', rooms[roomIndex].connUsers,userIndex);
  });

  // 방 나가는건 나중에 다시 만지자
  socket.on('leave_send', function(){
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: socket.userID});
    var msg;
    if(rooms[roomIndex].state == "대기중"){
      // 새로고침하거나 뒤로가기 할 때 정보를 삭제 시킨다.
      socket.leave(socket._id);
      msg = rooms[roomIndex].connUsers[userIndex].userName + '님이 나가셨습니다.';
      app.io.sockets.in(socket._id).emit('message_receive', msg);
      rooms[roomIndex].connUsers.splice(userIndex, 1);
      if(rooms[roomIndex].connUsers.length === 0){
        rooms.splice(roomIndex, 1);
        return;
      }
      app.io.sockets.in(socket._id).emit('room_connection_receive', rooms[roomIndex].connUsers);
    } else if(rooms[roomIndex].state == "게임중"){ // 게임 도중에는 새로고침을 해도 나가진다.
      socket.leave(socket._id);
      rooms[roomIndex].disconnUsers.push(socket.userID);
      var user = rooms[roomIndex].connUsers[userIndex];
      die_send(rooms[roomIndex].roomMoney , socket);
      userDataSave(user);
      msg = user + '님이 나가셨습니다.';
      app.io.sockets.in(socket._id).emit('message_receive', msg);
    }
  });

  socket.on('timer_send', function(){
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: socket.userID});
    var currentTurnUser = rooms[roomIndex].currentTurnUser;
    var gameUserIndex; 
    var stage = 0;
    var timerValue = 15;
    var timer = setInterval(function(){
      timerValue -= 1;
      app.io.sockets.in(socket._id).emit('timer_receive', timerValue);
      var deadUserIndex = _.findIndex(rooms[roomIndex].deadUsers, { userID: socket.userID});
      if( deadUserIndex != -1 ){
        clearInterval(timer);
      }
      var deadUsersNumber = rooms[roomIndex].deadUsers.length;
      if( deadUsersNumber == rooms[roomIndex].roomUserNumber-1 ){
        clearInterval(timer);
      }
      // 첫번쨰 패를 공개를 15초동안 기다리고 한번에 공개 만약 선택한 패가 없으면 첫번째 카드 공개
      if(timerValue <= 0 && stage === 0){
        timerValue = 15;
        stage = 1;
        rooms[roomIndex].connUsers[userIndex].money -= rooms[roomIndex].roomMoney;
        rooms[roomIndex].roomAllMoney += rooms[roomIndex].roomMoney;
        if( deadUserIndex == -1 ){
          rooms[roomIndex].gamingUsers.push({
            'userID' : (rooms[roomIndex].connUsers[userIndex].userID),
            'userName' : (rooms[roomIndex].connUsers[userIndex].userName),
            'isCall' : false,
            'bettingRemainCount' : 2,
            'pedigreeResult' : ''
          });
          app.io.sockets.in(socket._id).emit('one_open_card_receive', rooms[roomIndex], rooms[roomIndex].connUsers[userIndex]);
          var msg = "배팅을 시작하세요.";
          rooms[roomIndex].currentTurnUser = rooms[roomIndex].gamingUsers[0].userID;
          app.io.to(socket.id).emit('message_receive', msg);
          app.io.sockets.in(socket._id).emit('one_open_card_end_receive', rooms[roomIndex]);
        }
      } else if(timerValue <= 0 && stage === 1 ){ // 15초 내로 배팅을 안하고 있으면 자동 콜이 된다
          gameUserIndex = _.findIndex(rooms[roomIndex].gamingUsers, { userID: currentTurnUser });
          timerValue = 15; 
          if(rooms[roomIndex].gamingUsers[gameUserIndex].userID == rooms[roomIndex].connUsers[userIndex].userID)
            bettingEnd(rooms[roomIndex].roomAllMoney, socket, "콜");
      } else if(timerValue <= 0 && stage === 2 ){ // 15초 내로 카드 두장을 선택 안하면 첫번째, 두번째 패가 자동으로 선택
          gameUserIndex = _.findIndex(rooms[roomIndex].gamingUsers, { userID: currentTurnUser });
          timerValue = 15; 
          if(rooms[roomIndex].gamingUsers[gameUserIndex].userID == rooms[roomIndex].connUsers[userIndex].userID)
            finallySelect_send(rooms[roomIndex].connUsers[userIndex].cards, socket);
      }
      if(currentTurnUser != rooms[roomIndex].currentTurnUser){
        timerValue = 15;
        currentTurnUser = rooms[roomIndex].currentTurnUser;
      }
      var callIndexCount = _.countBy(rooms[roomIndex].gamingUsers, { isCall : true });
      if(callIndexCount.true == rooms[roomIndex].gamingUsers.length-1){
        stage = 2;
      }

      var gamingNumber = rooms[roomIndex].gamingUsers.length;
      if(gamingNumber == rooms[roomIndex].count && stage === 2){
        clearInterval(timer);
      }
    }, 1000);
  });
  socket.on('one_open_card_send', function (card) {
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: socket.userID });
    rooms[roomIndex].connUsers[userIndex].cards[0] = card;
  });
  socket.on('die_send', function(money){
    die_send(money, socket);
  });
  socket.on('half_send', function(money){
    bettingContinue(money, socket, "하프");
  });
  socket.on('bbing_send', function(money){
    bettingContinue(money, socket, "삥");
  });
  socket.on('dadang_send', function(money){
    bettingContinue(money, socket, "따당");
  });
  socket.on('check_send', function(money){
    bettingEnd(0, socket, "체크");
  });
  socket.on('call_send', function(money){
    bettingEnd(money, socket, "콜");
  });
  socket.on('twoCardAutoSelect', function (cards) {
    console.log(cards);
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: socket.userID });
    rooms[roomIndex].connUsers[userIndex].cards[0] = cards[0];
    rooms[roomIndex].connUsers[userIndex].cards[1] = cards[1];
  });
  socket.on('finallySelect_send', function(cards){
    finallySelect_send(cards,socket);
  });
  socket.on('gameContinueCheck_send', function(check){
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: socket.userID });
    if(userIndex == -1){
      return;
    }else{
      rooms[roomIndex].connUsers[userIndex].isReady = check;
      rooms[roomIndex].count += 1;
    }
    // 참여인원이 다 눌렀을 때
    if(rooms[roomIndex].roomUserNumber == rooms[roomIndex].count){
      var checkIndex = _.findIndex(rooms[roomIndex].connUsers, { isReady: false });
      if(checkIndex == -1 ){ // 모두 동의
        gameStart(roomIndex, socket._id);
        return;
      }
    }
    rooms[roomIndex].state = '대기중';
    app.io.sockets.in(socket._id).emit('room_connection_receive', rooms[roomIndex].connUsers);
  });
});

// uncomment after placing your favicon in /public
app.use(flash());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(path.join(__dirname, '/bower_components')));

app.use(methodOverride('_method', {methods: ['POST', 'GET']}));
// Session Setting
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'long-long-long-secret-string-1313513tefgwdsvbjkvasd'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  // console.log("REQ USER : ", req.user);
  res.locals.currentUser = req.user;
  next();
});

configAuth(passport);

app.use('/', index);
app.use('/user', user);
app.use('/game', game);

routeAuth(app, passport);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// 초기화
function initialize(roomIndex){
  rooms[roomIndex].roomAllMoney = 0;
  rooms[roomIndex].gamingUsers = [];
  rooms[roomIndex].cards = [];
  rooms[roomIndex].regame = 0;
  if(rooms[roomIndex].disconnUsers.length !== 0){
    var disUserIndex;
    for(var i = 0; i<rooms[roomIndex].disconnUsers.length;i++){
      disUserIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: rooms[roomIndex].disconnUsers[i] });    
      rooms[roomIndex].connUsers.splice(disUserIndex, 1);
    }
  }
  rooms[roomIndex].disconnUsers=[];
}
function gameStart(roomIndex, id) {
  rooms[roomIndex].deadUsers = [];
  rooms[roomIndex].count = 0;
  rooms[roomIndex].cards = _.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
  var msg = "한장씩 카드를 선택해주세요.";
  app.io.sockets.in(id).emit('message_receive', msg);
  app.io.sockets.in(id).emit('start_game', rooms[roomIndex]);
}
function searchRoomIndex(room, id){
  return _.findIndex(room, { _id: id });
}
// 카드 두장을 주고 우선순위를 보내준다 숫자가 낮을수록 족보 순위가 높은거
function cardPriority(card1, card2){
  if((card1 == 6 && card2 == 16 || card1 == 16 && card2 == 6)) return 1; // 38광떙
  else if((card1 == 2 && card2 == 16 || card1 == 16 && card2 == 2)) return 2; // 18광떙
  else if((card1 == 6 && card2 == 2 || card1 == 2 && card2 == 6)) return 3; // 13광떙
  else if((card1 == 20 && card2 == 21 || card1 == 21 && card2 == 20)) return 4; // 10광떙
  else if((card1 == 18 && card2 == 19 || card1 == 19 && card2 == 18)) return 5; // 9떙
  else if((card1 == 16 && card2 == 17 || card1 == 17 && card2 == 16)) return 6; // 8떙
  else if((card1 == 14 && card2 == 15 || card1 == 15 && card2 == 14)) return 7; // 7떙
  else if((card1 == 12 && card2 == 13 || card1 == 13 && card2 == 12)) return 8; // 6떙
  else if((card1 == 10 && card2 == 11 || card1 == 11 && card2 == 10)) return 9; // 5떙
  else if((card1 == 8 && card2 == 9 || card1 == 9 && card2 == 8)) return 10; // 4떙
  else if((card1 == 7 && card2 == 6 || card1 == 6 && card2 == 7)) return 11; // 3떙
  else if((card1 == 4 && card2 == 5 || card1 == 5 && card2 == 4)) return 12; // 2떙
  else if((card1 == 2 && card2 == 3 || card1 == 3 && card2 == 2)) return 13; // 1떙
  else if((card1 == 8 && card2 == 14 || card1 == 14 && card2 == 8)) return 100; // 암행어사(일삼이랑 일팔만 잡을 수 있고 없으면 그냥 한끗)
  else { // 여기서 부턴 달로 계산
    card1 = parseInt(card1/2);
    card2 = parseInt(card2/2);
    if((card1 == 1 && card2 == 2) || (card1 == 2 && card2 == 1)) return 14; // 알리
    else if((card1 == 1 && card2 == 9 || card1 == 9 && card2 == 1)) return 15; // 구삥
    else if((card1 == 10 && card2 == 1 || card1 == 1 && card2 == 10)) return 16; // 장삥
    else if((card1 == 4 && card2 == 6 || card1 == 6 && card2 == 4)) return 17; // 세륙
    else if((card1 == 4 && card2 == 9 || card1 == 9 && card2 == 4)) return 200; // 49파토(알리 이하일떄만)
    else if((card1 == 3 && card2 == 7 || card1 == 7 && card2 == 3)) return 300; // 땡잡이(떙만 잡을 수 있고 땡이 없으면 그냥 망통(0끗) 광떙은 못잡는다.)
    else if((card1+card2)%10 == 9) return 18; // 갑오
    else if((card1+card2)%10 == 8) return 19; // 8끗
    else if((card1+card2)%10 == 7) return 20; // 7끗
    else if((card1+card2)%10 == 6) return 21; // 6끗
    else if((card1+card2)%10 == 5) return 22; // 5끗
    else if((card1+card2)%10 == 4) return 23; // 4끗
    else if((card1+card2)%10 == 3) return 24; // 3끗
    else if((card1+card2)%10 == 2) return 25; // 2끗
    else if((card1+card2)%10 == 1) return 26; // 1끗
    else if((card1+card2)%10 === 0) return 27; // 망통(0끗)
  }

}
function die_send(money , socket){
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: socket.userID });
    var gameUserIndex = _.findIndex(rooms[roomIndex].gamingUsers, { userID: rooms[roomIndex].connUsers[userIndex].userID });
    var gamingNumber = rooms[roomIndex].gamingUsers.length;
    rooms[roomIndex].connUsers[userIndex].money -= money;
    rooms[roomIndex].roomAllMoney += money;
    if(gameUserIndex != -1){
      if(rooms[roomIndex].gamingUsers[gameUserIndex].userID == rooms[roomIndex].currentTurnUser){
        rooms[roomIndex].currentTurnUser = rooms[roomIndex].gamingUsers[(gameUserIndex+1)%gamingNumber].userID;
      }
      rooms[roomIndex].gamingUsers.splice(gameUserIndex,1);
    }
    rooms[roomIndex].deadUsers.push({
      'userID' : (rooms[roomIndex].connUsers[userIndex].userID),
      'userName' : (rooms[roomIndex].connUsers[userIndex].userName)
    });
    app.io.sockets.in(socket._id).emit('die_receive', rooms[roomIndex], rooms[roomIndex].connUsers[userIndex]);
    if(rooms[roomIndex].deadUsers.length == rooms[roomIndex].connUsers.length-1){
      var user;
      for(var i = 0; i < rooms[roomIndex].connUsers.length; i++){
        var deadUserIndex = _.findIndex(rooms[roomIndex].deadUsers, { userID: rooms[roomIndex].connUsers[i].userID });
        if(deadUserIndex == -1){
          rooms[roomIndex].connUsers[i].money += rooms[roomIndex].roomAllMoney;
          rooms[roomIndex].connUsers[i].win += 1;
          user = rooms[roomIndex].connUsers[i];
        } else{
          rooms[roomIndex].connUsers[i].lose += 1;
        }
      }
      initialize(roomIndex);
      msg = user.userName + "님이 승리 하셨습니다.";
      app.io.sockets.in(socket._id).emit('message_receive', msg);
      app.io.sockets.in(socket._id).emit('gameContinueCheck_receive', rooms[roomIndex], user);
    }
  }
  function bettingContinue(money, socket, state){
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var gameUserIndex = _.findIndex(rooms[roomIndex].gamingUsers, { userID: socket.userID });
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: rooms[roomIndex].gamingUsers[gameUserIndex].userID });
    var gamingNumber = rooms[roomIndex].gamingUsers.length;
    if(rooms[roomIndex].gamingUsers[gameUserIndex].userID != rooms[roomIndex].currentTurnUser){
      app.io.to(socket.id).emit('message_receive', "자신의 턴이 아닙니다.");
      return;
    }else{
      rooms[roomIndex].gamingUsers[(gameUserIndex+gamingNumber)%(gamingNumber-1)].isCall = false;
      rooms[roomIndex].gamingUsers[gameUserIndex].isCall = false;
      if(rooms[roomIndex].gamingUsers[gameUserIndex].bettingRemainCount === 0){
        app.io.to(socket.id).emit('message_receive', "call, check을 제외한 배팅의 횟수가 끝났습니다.");
        return;
      }
      rooms[roomIndex].gamingUsers[gameUserIndex].bettingRemainCount -= 1;
      if(money > rooms[roomIndex].connUsers[userIndex].money){
        app.io.to(socket.id).emit('message_receive', "돈이 부족합니다.");
      }else{
        rooms[roomIndex].connUsers[userIndex].money -= money;
        rooms[roomIndex].roomAllMoney += money;
        rooms[roomIndex].currentTurnUser = rooms[roomIndex].gamingUsers[(gameUserIndex+1)%gamingNumber].userID;
        app.io.sockets.in(socket._id).emit('betting_receive', rooms[roomIndex], rooms[roomIndex].gamingUsers[gameUserIndex], state);
      }
      return;
    }
  }
  function bettingEnd(money, socket, state){
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var gameUserIndex = _.findIndex(rooms[roomIndex].gamingUsers, { userID: socket.userID });
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: rooms[roomIndex].gamingUsers[gameUserIndex].userID });
    var gamingNumber = rooms[roomIndex].gamingUsers.length;
    if(rooms[roomIndex].gamingUsers[gameUserIndex].userID != rooms[roomIndex].currentTurnUser){
      app.io.to(socket.id).emit('message_receive', "자신의 턴이 아닙니다.");
      return;
    }else{
      rooms[roomIndex].gamingUsers[gameUserIndex].isCall = true;
      if(money > rooms[roomIndex].connUsers[userIndex].money){
        rooms[roomIndex].roomAllMoney += rooms[roomIndex].connUsers[userIndex].money;
        rooms[roomIndex].connUsers[userIndex].money = 0;
        app.io.sockets.in(socket._id).emit('message_receive', rooms[roomIndex].connUsers[userIndex].userName + "님이 올인을 했습니다.");
      }else{
        rooms[roomIndex].connUsers[userIndex].money -= money;
        rooms[roomIndex].roomAllMoney += money;
      }
      rooms[roomIndex].currentTurnUser = rooms[roomIndex].gamingUsers[(gameUserIndex+1)%gamingNumber].userID;
      app.io.sockets.in(socket._id).emit('betting_receive', rooms[roomIndex], rooms[roomIndex].gamingUsers[gameUserIndex], state);
    }
    var callIndexCount = _.countBy(rooms[roomIndex].gamingUsers, { isCall : true });
    if(callIndexCount.true == rooms[roomIndex].gamingUsers.length-1){
      app.io.sockets.in(socket._id).emit('message_receive', "마지막으로 2장을 선택해주세요.");
      app.io.sockets.in(socket._id).emit('lastCardDistribution_receive', rooms[roomIndex], roomIndex);
    }
    return;
  }
  function finallySelect_send(cards, socket){
    var roomIndex = searchRoomIndex(rooms, socket._id);
    var gameUserIndex = _.findIndex(rooms[roomIndex].gamingUsers, { userID: socket.userID });
    var userIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: rooms[roomIndex].gamingUsers[gameUserIndex].userID });
    var gamingNumber = rooms[roomIndex].gamingUsers.length;
    var msg;
    if(rooms[roomIndex].gamingUsers[gameUserIndex].userID != rooms[roomIndex].currentTurnUser && rooms[roomIndex].regame === 0){
      app.io.to(socket.id).emit('message_receive', "자신의 턴이 아닙니다.");
      return;
    }else{
      rooms[roomIndex].connUsers[userIndex].cards[0] = cards[0];
      rooms[roomIndex].connUsers[userIndex].cards[1] = cards[1];
      rooms[roomIndex].count += 1;
      rooms[roomIndex].currentTurnUser = rooms[roomIndex].gamingUsers[(gameUserIndex+1)%gamingNumber].userID;
      rooms[roomIndex].gamingUsers[gameUserIndex].pedigreeResult = cardPriority(cards[0], cards[1]);
      app.io.to(socket.id).emit('cardButtonEmpty_receive');
      app.io.sockets.in(socket._id).emit('finallySelect_receive', cards, rooms[roomIndex], rooms[roomIndex].gamingUsers[gameUserIndex]);
    }
    // 참여자가 다 2장씩 선택 한후
    if(gamingNumber == rooms[roomIndex].count){
      if(rooms[roomIndex].regame === 0){
        setTimeout(function(){
          finallyResult(roomIndex, socket);
        },1000);
      }else if(rooms[roomIndex].regame == 1){
        setTimeout(function(){
          finallyResult(roomIndex, socket);
        },5000);
      }
    }
  }

function finallyResult(roomIndex, socket){
  rooms[roomIndex].count = 0;
  var amhang = _.findIndex(rooms[roomIndex].gamingUsers, {pedigreeResult: 100});
  var pato = _.findIndex(rooms[roomIndex].gamingUsers, {pedigreeResult: 200});
  var ddangKiller = _.findIndex(rooms[roomIndex].gamingUsers, {pedigreeResult: 300});
  var user = _.min(rooms[roomIndex].gamingUsers, "pedigreeResult");
  if(pato != -1){
    if(user.pedigreeResult > 13){
      rooms[roomIndex].cards = _.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
      msg = "49파토 때문에 다시 게임을 시작합니다.";
      rooms[roomIndex].regame = 1;
      app.io.sockets.in(socket._id).emit('message_receive', msg);
      app.io.sockets.in(socket._id).emit('resetGame_receive', rooms[roomIndex]);
      return;
    }
  }else if(ddangKiller != -1){
    if(user.pedigreeResult > 3 && user.pedigreeResult < 14){
      user = rooms[roomIndex].gamingUsers[ddangKiller];
    }
  }else if(amhang != -1){
    if(user.pedigreeResult == 2 || user.pedigreeResult == 3){
      user = rooms[roomIndex].gamingUsers[amhang];
    }
  }
  var userCount = _.countBy(rooms[roomIndex].gamingUsers, { pedigreeResult : user.pedigreeResult });
  // 비길때(미완성)
  if(userCount.true > 1){
    rooms[roomIndex].cards = _.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
    rooms[roomIndex].regame = 1;
    msg = "게임을 비겨서 다시 게임을 시작합니다.";
    app.io.sockets.in(socket._id).emit('message_receive', msg);
    app.io.sockets.in(socket._id).emit('resetGame_receive', rooms[roomIndex]);
    return;
  }
  // (다시 만지기)
  for(var i = 0; i < rooms[roomIndex].connUsers.length; i++){
    if(user.userID == rooms[roomIndex].connUsers[i].userID){
      rooms[roomIndex].connUsers[i].money += rooms[roomIndex].roomAllMoney;
      rooms[roomIndex].connUsers[i].win += 1;
    } else{
      rooms[roomIndex].connUsers[i].lose += 1;
    }
  }
  initialize(roomIndex);
  msg = user.userName + "님이 승리 하셨습니다.";
  app.io.sockets.in(socket._id).emit('message_receive', msg);
  app.io.sockets.in(socket._id).emit('gameContinueCheck_receive', rooms[roomIndex], user);
}

function userDataSave(user){
  User.findOne({_id: user.userID},function(err, myUser){
      if (err) {
        return next(err);
      }
      myUser.win = user.win;
      myUser.lose = user.lose;
      myUser.money = user.money;
      myUser.save(function(err) {
        if (err) {
          return next(err);
        }
      });
  });
}
module.exports = app;
