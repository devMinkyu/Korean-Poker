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

var count = 1;
app.io.on('connection', function(socket){
  console.log('user conneected: ', socket.id);
  var name = "user" + count++;

  console.log('user : ', name);
  app.io.to(socket.id).emit('change name',name);

  socket.on('room_connection', function(data){
    socket.join(data);
    socket.roomName = data;
    socket.nickName = name;
    var index = searchRoomIndex(rooms, data);
    rooms[index].connUsers.push({
      'userID' : name,
      'ready' : 0
    });

    rooms[index].currentUser = rooms[index].connUsers[0].userID;
    console.log(rooms);
    console.log(rooms[index].connUsers);
    console.log(socket.id);
  });
  // 방에 들어온 인원들만 메세지를 주고 받을 수 있다.
  socket.on('message_send', function(name, text){
    name = socket.nickName;
    room = socket.roomName;
    var msg = name + ':' + text;
    console.log(socket.id);
    console.log(socket.join);
    app.io.sockets.in(room).emit('message_receive', msg);
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
