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
var userNumber = 0;
var gamingNumber = 0;
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
      if(!rooms[index].connUsers[j].isReady){
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
    userNumber++;
    var index = searchRoomIndex(rooms, socket._id);
    var connNumber = rooms[index].connUsers.length;
    // 턴 검사
    for(var i = 0; i < rooms[index].connUsers.length; i++){
      if(rooms[index].connUsers[i].userName == socket.userName){
        if(rooms[index].connUsers[i].userName != rooms[index].currentTurnUser){
          app.io.to(socket.id).emit('message_receive', "자신의 턴이 아닙니다.");
          return;
        } else{
          // 우선은 유저이름으로 넣어준다.
          rooms[index].connUsers[i].money -= money;
          rooms[index].roomMoney += money;
          rooms[index].currentTurnUser = rooms[index].connUsers[(i+1)%connNumber].userName;
          rooms[index].gamingUsers.push(rooms[index].connUsers[i]);
          app.io.sockets.in(socket._id).emit('one_open_card_receive', card, rooms[index], rooms[index].connUsers[i]);
          if(connNumber == userNumber){
            var msg = "Call, Half중에 선택하세요.";
            rooms[index].currentTurnUser = rooms[index].gamingUsers[0].userName;
            app.io.sockets.in(socket._id).emit('message_receive', msg);
            app.io.sockets.in(socket._id).emit('one_open_card_end_receive', rooms[index], rooms[index].gamingUsers);
          }
        }
      }
    }
  });
  socket.on('die_send', function(money){
      userNumber++;
      var index = searchRoomIndex(rooms, socket._id);
      var connNumber = rooms[index].connUsers.length;
      // 턴 검사
      for(var i = 0; i < rooms[index].connUsers.length; i++){
        if(rooms[index].connUsers[i].userName == socket.userName){
          if(rooms[index].connUsers[i].userName != rooms[index].currentTurnUser){
            app.io.to(socket.id).emit('message_receive', "자신의 턴이 아닙니다.");
            return;
          }else{
            rooms[index].connUsers[i].money -= money;
            rooms[index].roomMoney += money;
            rooms[index].currentTurnUser = rooms[index].connUsers[(i+1)%connNumber].userName;
            app.io.sockets.in(socket._id).emit('die_receive', rooms[index], rooms[index].connUsers[i]);
            if(connNumber == userNumber){
              var msg = "Call, Half중에 선택하세요.";
              rooms[index].currentTurnUser = rooms[index].gamingUsers[0].userName;
              app.io.sockets.in(socket._id).emit('message_receive', msg);
              app.io.sockets.in(socket._id).emit('one_open_card_end_receive', rooms[index],rooms[index].gamingUsers);
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


function searchRoomIndex(room, id){
  for(var i = 0; i < room.length; i++){
    if(room[i]._id == id){
      return i;
    }
  }
  return -1;
}
module.exports = app;
