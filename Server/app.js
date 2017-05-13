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

app.io.on('connection', function(socket){
  console.log('user conneected: ', socket.id);
  console.log("**********Room ID*************");
  console.log(socket._id);
  console.log("***************************");
  // app.io.to(socket.id).emit('change name', name);

  socket.on('room_connection', function(_id, currentUserName){
  // socket.on('room_connection', function(_id){    
    socket.join(_id);
    // socket.roomName = data;
    // socket._id 는 room 배열의 인덱스
    socket._id = _id;
    socket.userName = currentUserName;

    var message = socket.userName + " 님이 입장하셨습니다.";
    // app.io.sockets.in(socket.roomName).emit('message_receive', msg);
    app.io.sockets.in(socket._id).emit('message_receive', message);
    
  });
  // 방에 들어온 인원들만 메세지를 주고 받을 수 있다.
  socket.on('message_send', function(text){
    // name = socket.nickName;
    // room = socket.roomName;
    // var _id = socket._id;
    
    var message = socket.userName + ':' + text;
    // app.io.sockets.in(room).emit('message_receive', msg);
    app.io.sockets.in(socket._id).emit('message_receive', message);
    
  });
  socket.on('ready_send', function(){
    // name = socket.nickName;
    // room = socket.roomName;
    // var index = searchRoomIndex(rooms, room);
    // for(var i = 0; i < rooms[index].connUsers.length; i++){
    //   if(rooms[index].connUsers[i].userID == name){
    //     rooms[index].connUsers[i].ready = 'ready';
    //     break;
    //   }
    // }

    rooms[socket._id].connUsers[i].ready = 'ready';
    app.io.sockets.in(room).emit('ready_receive', 'ready');
  });
  socket.on('leave_send', function(){
    console.log(socket.id);
    // name = socket.nickName;
    // room = socket.roomName;
    // // 새로고침하거나 뒤로가기 할 때 정보를 삭제 시킨다.
    // socket.leave(room);
    // var index = searchRoomIndex(rooms, room);
    // for(var i = 0; i < rooms[index].connUsers.length; i++){
    //   if(rooms[index].connUsers[i].userID == name){
    //     rooms[index].connUsers.splice(i,1);
    //     var msg = name + '님이 :' + "나가셨습니다.";
    //     app.io.sockets.in(room).emit('message_receive', msg);
    //     break;
    //   }
    // }
    // // 방의 인원이 한명도 없을때 방을 삭제
    // if(rooms[index].connUsers.length === 0){
    //   rooms.splice(index,1);
    // }
    if(rooms[socket._id].connUsers.length === 0){
      rooms.splice(socket._id, 1);
      roomsCount--;
      if(roomsCount < 0){
        roomsCount = 0;
      }
    }
    socket.leave(socket._id);
    
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


function searchRoomIndex(room, name){
  for(var i = 0; i < room.length; i++){
    if(room[i].roomName == name){
      return i;
    }
  }
  return -1;
}

module.exports = app;
