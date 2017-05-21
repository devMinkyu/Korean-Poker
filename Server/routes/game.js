var express = require('express');
var router = express.Router();
var User = require('../models/User');
var _ = require('underscore');

// var http = require('http').Server(express());
// var io = require('socket.io')(http);

var async = require('async');
var fs = require('fs');
var rmdir = require('rmdir');
var multipart = require('multiparty');

// middle ware 회원 확인


function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.sendStatus(401);
  }
}

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') {
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST'){
              cb(null);
            }
            else cb(err);
        } else cb(null);
    });
}

/* image Upload
function uploadFile(file, dirPath, res){
  fs.readFile(file.path, function(err, data){
      var filePath = dirPath + "/" + file.originalFilename;
      fs.writeFile(filePath, data, function(err){
        if(err){
          return res.sendStatus(500);
        } else {
          return res.sendStatus(200);
        }
      });
  });
}
*/
// router.get('/', needAuth, function(req, res, next) {
//   var cards = _.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
//   console.log(cards);
//   res.render('game', {cards : cards});
// });
//
// router.get('/:id', function(req, res, next) {
//   console.log(req.params.id);
// });
//
// router.post('/', needAuth, function(req, res, next) {
//
// });
global.rooms = [];
global.roomsCount = 0;
global.name = null;
var count = 1;
// router.get('/', needAuth, function(req,res, next){
router.get('/', function(req,res, next){
  // res.render('exam/examMake');
  res.render('Game/GameRoomList');
});
// router.get('/create', needAuth, function(req,res, next){
router.get('/create', function(req,res, next){
  res.render('Game/GameRoomCreate');
});

// router.post('/', needAuth, function(req, res, next){
router.post('/', function(req, res, next){
  if(isNaN(Number(req.body.roomMoney))){
    req.flash('danger', '판돈을 숫자로 입력해주세요.');
    return res.redirect('back');
  }
  // if(searchRoomIndex(rooms, req.body.roomName) == -1){
    var newRoom = {
      '_id' : roomsCount,
      'roomName' : req.body.roomName, // 방 제목
      'roomMoney' : Number(req.body.roomMoney), // 방의 판돈
      'roomAllMoney' : 0, // 방의 배팅금
      'connUsers' : [], // 방에 들어온 사람들
      'gamingUsers' : [], // 게임의 참여자들
      'deadUsers' :[], // 게임의 죽은 유저
      'currentTurnUser': '',
      'state' : 'Waiting game',
      'cards' : [0, 0],
      'timer' : 15,
      'count' : 0 // 참여한 사람이 한번씩 돌아가면서 돌릴 수 있도록 카운트해준다
    };
    rooms.push(newRoom);
    roomsCount++;
    // var index = searchRoomIndex(rooms, req.body.roomName);

    // addUser(index, req.user._id, req.user.userName);
    addUser(newRoom._id, req.user._id, req.user.userName);
    // rooms[index].currentTurnUser = rooms[index].connUsers[0].userID;
    //rooms[roomsCount].currentTurnUser = rooms[roomsCount].connUsers[0].userID;
    newRoom.currentTurnUser = newRoom.connUsers[0].userName;
    //newRoom.connUsers[0].isTurn = true;


    // res.render('exam/examGame', {room: newRoom, users: newRoom.connUsers});
    res.render('Game/GameRoom', {room: newRoom});


  // }else{
  //   req.flash('danger', '똑같은 방이름이 있습니다.');
  //   return res.redirect('back');
  // }
});

router.get('/:id', function(req,res, next){
  // var index = searchRoomIndex(rooms, req.params.id);
  var index = req.params.id;
  var selectedRoom = rooms[index];
  if(selectedRoom.connUsers.length < 4 && selectedRoom.state == "Waiting game"){

    // 원래 이렇게 해야함.
    // addUser(selectedRoom._id, req.user._id, req.user.userName);
    // selectedRoom.currentTurnUser = req.user._id;

    // 테스트용
    var userTestID = "TEST" + count++;
    addUser(selectedRoom._id, userTestID, userTestID);

    res.render('Game/GameRoom', {room: selectedRoom});
  } else {
    req.flash('danger', '방을 들어갈 수 없습니다.');
    return res.redirect('back');
  }
});

function searchRoomIndex(room, name){
  for(var i = 0; i < room.length; i++){
    if(room[i].roomName == name){
      return i;
    }
  }
  return -1;
}
// 원래는 레디 다  false로 시작해야한다.
function addUser(roomIndex, userID, userName){
  rooms[roomIndex].connUsers.push({
    'userID' : userID,
    'userName' : userName,
    'isReady' :  false,
    //'isGameParticipate' : false,
    // 여기 부분은 디비에 있는것을 집어넣어준다.
    'win' : 0,
    'lose' : 0,
    'money' : 100000,
    'cards' : []
  });
}
module.exports = router;
