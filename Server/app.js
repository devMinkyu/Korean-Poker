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

var app = express();
app.io = require('socket.io')();


// app.use(favicon(__dirname + '/public/images/logos/favicon.ico'));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.locals.moment = require('moment');
// mongodb connect
mongoose.connect('mongodb://localhost:27017/koreanpoker');
mongoose.connection.on('error', console.log);

var cards = _.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
app.io.on('connection', function(socket){
  console.log('user conneected: ', socket.id);

  socket.on('room_connection_send', function(_id, currentUserName){
    socket.join(_id);
    // socket._id 는 room 배열의 인덱스
    socket._id = _id;
    socket.userName = currentUserName;

    console.log("**********Room ID*************");
    console.log(socket._id);
    console.log("***************************");

    var message = socket.userName + " 님이 입장하셨습니다.";
    app.io.sockets.in(socket._id).emit('message_receive', message);
    socket.broadcast.to(socket._id).emit('room_connection_receive', rooms[socket._id].connUsers);
  });
  // 방에 들어온 인원들만 메세지를 주고 받을 수 있다.
  socket.on('message_send', function(text){
    var message = socket.userName + ':' + text;
    app.io.sockets.in(socket._id).emit('message_receive', message);

  });

  socket.on('ready_send', function(){
    var index = searchRoomIndex(rooms, socket._id);
    var i = 0;
    for(;i < rooms[index].connUsers.length; i++){
      if(rooms[index].connUsers[i].userName == socket.userName){
        rooms[index].connUsers[i].isReady = true;
        break;
      }
    }
    for(var j = 0;j < rooms[index].connUsers.length; j++){
      // 한명이라도 레디를 안했거나 인원수가 1명일때
      if(!rooms[index].connUsers[j].isReady || rooms[index].connUsers.length < 2){
        app.io.sockets.in(socket._id).emit('ready_receive', rooms[index].connUsers,i);
        return;
      }
    }
    rooms[index].state = "During a game";
    var msg = "한장씩 카드를 공개 하세요. 아니시면 Die 하세요.";
    app.io.sockets.in(socket._id).emit('message_receive', msg);
    app.io.sockets.in(socket._id).emit('start_game', cards,rooms[index]);
  });

  // 방 나가는건 나중에 다시 만지자
  socket.on('leave_send', function(){
    console.log(socket.id);
    // // 새로고침하거나 뒤로가기 할 때 정보를 삭제 시킨다.
    socket.leave(socket._id);
    var index = searchRoomIndex(rooms, socket._id);
    for(var i = 0; i < rooms[index].connUsers.length; i++){
      if(rooms[index].connUsers[i].userName == socket.userName){
        rooms[index].connUsers.splice(i,1);
        var msg = socket.userName + '님이 ' + "나가셨습니다.";
        app.io.sockets.in(socket._id).emit('message_receive', msg);
        break;
      }
    }
    if(rooms[index].connUsers.length === 0){
      rooms.splice(index, 1);
      // roomsCount--;
      // if(roomsCount < 0){
      //   roomsCount = 0;
      // }
    }
  });
  socket.on('one_open_card_send', function (card, money) {
    var index = searchRoomIndex(rooms, socket._id);
    var connNumber = rooms[index].connUsers.length;
    rooms[index].count += 1;
    // 턴 검사
    for(var i = 0; i < rooms[index].connUsers.length; i++){
      if(rooms[index].connUsers[i].userName == socket.userName){
        if(rooms[index].connUsers[i].userName != rooms[index].currentTurnUser){
          app.io.to(socket.id).emit('message_receive', "자신의 턴이 아닙니다.");
        } else{
          // 우선은 유저이름으로 넣어준다.
          rooms[index].connUsers[i].money -= money;
          rooms[index].roomAllMoney += money;
          rooms[index].currentTurnUser = rooms[index].connUsers[(i+1)%connNumber].userName;
          rooms[index].gamingUsers.push({
            'userID' : (rooms[index].connUsers[i].userID),
            'userName' : (rooms[index].connUsers[i].userName),
            'isCall' : false,
            'halfRemainCount' : 2,
            'pedigreeResult' : ''
          });
          app.io.sockets.in(socket._id).emit('one_open_card_receive', card, rooms[index], rooms[index].connUsers[i]);
          // userNumber은 다시 생각해보기 중복되서 체크
          if(connNumber == rooms[index].count){
            rooms[index].count = 0;
            var msg = "Call, Half중에 선택하세요.";
            rooms[index].currentTurnUser = rooms[index].gamingUsers[0].userName;
            app.io.sockets.in(socket._id).emit('message_receive', msg);
            app.io.sockets.in(socket._id).emit('one_open_card_end_receive', rooms[index]);
          }
        }
        return;
      }
    }
  });
  socket.on('die_send', function(money){
      var index = searchRoomIndex(rooms, socket._id);
      var connNumber = rooms[index].connUsers.length;
      rooms[index].count += 1;
      // 턴 검사
      for(var i = 0; i < connNumber; i++){
        if(rooms[index].connUsers[i].userName == socket.userName){
          if(rooms[index].connUsers[i].userName != rooms[index].currentTurnUser){
            app.io.to(socket.id).emit('message_receive', "자신의 턴이 아닙니다.");
          }else{
            rooms[index].connUsers[i].money -= money;
            rooms[index].roomAllMoney += money;
            rooms[index].currentTurnUser = rooms[index].connUsers[(i+1)%connNumber].userName;
            app.io.sockets.in(socket._id).emit('die_receive', rooms[index], rooms[index].connUsers[i]);
            if(connNumber == rooms[index].count){
              rooms[index].count = 0;
              var msg = "Call, Half중에 선택하세요.";
              rooms[index].currentTurnUser = rooms[index].gamingUsers[0].userName;
              app.io.sockets.in(socket._id).emit('message_receive', msg);
              app.io.sockets.in(socket._id).emit('one_open_card_end_receive', rooms[index]);
            }
          }
          return;
        }
      }
  });
  socket.on('half_send', function(money){
    var index = searchRoomIndex(rooms, socket._id);
    var gamingNumber = rooms[index].gamingUsers.length;
    for(var i = 0; i < gamingNumber; i++){
      if(rooms[index].gamingUsers[i].userName == socket.userName){
        if(rooms[index].gamingUsers[i].userName != rooms[index].currentTurnUser){
          app.io.to(socket.id).emit('message_receive', "자신의 턴이 아닙니다.");
        }else{
          rooms[index].gamingUsers[(i+gamingNumber)%(gamingNumber-1)].isCall = false;
          rooms[index].gamingUsers[i].isCall = false;
          if(rooms[index].gamingUsers[i].halfRemainCount === 0){
            app.io.to(socket.id).emit('message_receive', "half를 할 수 있는 횟수가 끝났습니다.");
            return;
          }
          rooms[index].gamingUsers[i].halfRemainCount -= 1;
          for(j = 0; j < rooms[index].connUsers.length; j++){
            if(rooms[index].gamingUsers[i].userName == rooms[index].connUsers[j].userName){
              if(money > rooms[index].connUsers[j].money){
                app.io.to(socket.id).emit('message_receive', "돈이 부족합니다.");
                return;
              }
              rooms[index].connUsers[j].money -= money;
              break;
            }
          }
          rooms[index].roomAllMoney += money;
          rooms[index].currentTurnUser = rooms[index].gamingUsers[(i+1)%gamingNumber].userName;
          app.io.sockets.in(socket._id).emit('half_receive', rooms[index], rooms[index].gamingUsers[i]);
        }
        return;
      }
    }
  });
  socket.on('call_send', function(money){
    var index = searchRoomIndex(rooms, socket._id);
    var gamingNumber = rooms[index].gamingUsers.length;
    for(var i = 0; i < rooms[index].gamingUsers.length; i++){
      if(rooms[index].gamingUsers[i].userName == socket.userName){
        if(rooms[index].gamingUsers[i].userName != rooms[index].currentTurnUser){
          app.io.to(socket.id).emit('message_receive', "자신의 턴이 아닙니다.");
        }else{
          rooms[index].gamingUsers[i].isCall = true;
          for(j = 0; j < rooms[index].connUsers.length; j++){
            if(rooms[index].gamingUsers[i].userName == rooms[index].connUsers[j].userName){
              rooms[index].connUsers[j].money -= money;
              break;
            }
          }
          rooms[index].roomAllMoney += money;
          rooms[index].currentTurnUser = rooms[index].gamingUsers[(i+1)%gamingNumber].userName;
          app.io.sockets.in(socket._id).emit('call_receive', rooms[index], rooms[index].gamingUsers[i]);
          var count = 0;
          for(var j = 0; j < rooms[index].gamingUsers.length; j++){
            if(rooms[index].gamingUsers[j].isCall){
              count++;
            }
          }
          if(count == rooms[index].gamingUsers.length-1){
            app.io.sockets.in(socket._id).emit('message_receive', "마지막으로 2장을 선택해주세요.");
            app.io.sockets.in(socket._id).emit('lastCardDistribution_receive', rooms[index], cards);
          }
          return;
        }
      }
    }
  });
  // socket.on('timer_send', function(){
  //   var index = searchRoomIndex(rooms, socket._id);
  //
  //   setInterval(function(){
  //     rooms[index].timer -= 1;
  //     app.io.sockets.in(socket._id).emit('timer_receive', rooms[index]);
  //   }, 1000);
  // });
  socket.on('finallySelect_send', function(cards){
    console.log(cardPriority(cards[0], cards[1]));
    var index = searchRoomIndex(rooms, socket._id);
    var gamingNumber = rooms[index].gamingUsers.length;
    rooms[index].count += 1;
    for(var i = 0; i < gamingNumber; i++){
      if(rooms[index].gamingUsers[i].userName == socket.userName){
        if(rooms[index].gamingUsers[i].userName != rooms[index].currentTurnUser){
          app.io.to(socket.id).emit('message_receive', "자신의 턴이 아닙니다.");
        }else{
          rooms[index].currentTurnUser = rooms[index].gamingUsers[(i+1)%gamingNumber].userName;
          rooms[index].gamingUsers[i].pedigreeResult = cardPriority(cards[0], cards[1]);
          app.io.sockets.in(socket._id).emit('finallySelect_receive', cards, rooms[index], rooms[index].gamingUsers[i]);
          if(gamingNumber == rooms[index].count){
            rooms[index].count = 0;
            user = _.min(rooms[index].gamingUsers, "pedigreeResult");
            for(var j = 0; j < rooms[index].connUsers.length; j++){
              if(user.userName == rooms[index].connUsers[j].userName){
                rooms[index].connUsers[j].money += rooms[index].roomAllMoney;
                rooms[index].connUsers[j].win += 1;
              }else{
                rooms[index].connUsers[j].lose += 1;
              }
            }
            var msg = user.userName + "님이 승리 하셨습니다.";
            app.io.sockets.in(socket._id).emit('message_receive', msg);
            app.io.sockets.in(socket._id).emit('gameEnd_receive', rooms[index], user);
            initialize(index);
          }
        }
      }
    }
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

function initialize(index) {
  rooms[index].roomAllMoney = 0;
  rooms[index].gamingUsers = [];
  rooms[index].state = 'Waiting game';
  rooms[index].currentTurnUser = rooms[index].connUsers[0].userName;;

}
function searchRoomIndex(room, id){
  for(var i = 0; i < room.length; i++){
    if(room[i]._id == id){
      return i;
    }
  }
  return -1;
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
  else if((card1 == 8 && card2 == 14 || card1 == 14 && card2 == 8)) return -1; // 암행어사(일삼이랑 일팔만 잡을 수 있고 없으면 그냥 한끗)
  else { // 여기서 부턴 달로 계산
    card1 = parseInt(card1/2);
    card2 = parseInt(card2/2);
    if((card1 == 1 && card2 == 2) || (card1 == 2 && card2 == 1)) return 14; // 알리
    else if((card1 == 1 && card2 == 9 || card1 == 9 && card2 == 1)) return 15; // 구삥
    else if((card1 == 10 && card2 == 1 || card1 == 1 && card2 == 10)) return 16; // 장삥
    else if((card1 == 4 && card2 == 6 || card1 == 6 && card2 == 4)) return 17; // 세륙
    else if((card1 == 4 && card2 == 9 || card1 == 9 && card2 == 4)) return -2; // 49파토(알리 이하일떄만)
    else if((card1 == 3 && card2 == 7 || card1 == 7 && card2 == 3)) return 0; // 땡잡이(떙만 잡을 수 있고 땡이 없으면 그냥 망통(0끗) 광떙은 못잡는다.)
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



module.exports = app;
