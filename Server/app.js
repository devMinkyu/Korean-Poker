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
  app.io.to(socket.id).emit('change name',name);

  app.io.on('roomMakeSend', function(data){
    console.log(data);
    rooms.push({
      'roomName' : data.roomName, // 방 제목
      'roomMoney' : 0, // 방의 판돈
      'connUsers' : [], // 방에 들어온 사람들
      'gamingUsers' : [], // 게임의 참여자들
      'current_user' : '', // 현재턴의 사람
      'state' : 'ready'
    });
  });
});


// uncomment after placing your favicon in /public
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

module.exports = app;
