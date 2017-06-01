var express = require('express');
var router = express.Router();
var User = require('../models/User');
var _ = require('underscore');


var async = require('async');
var fs = require('fs');
var rmdir = require('rmdir');
var multipart = require('multiparty');

// middle ware 회원 확인



function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', '로그인이 필요합니다.');
    return res.redirect('/');
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

global.rooms = [];
global.roomsCount = 0;
global.name = null;
var count = 1;
router.get('/', needAuth, function(req,res, next){
  res.render('Game/GameRoomList');
});
router.get('/create',needAuth, function(req,res, next){
  res.render('Game/GameRoomCreate');
});

router.post('/', needAuth, function(req, res, next){
  var roomIndex = _.findIndex(rooms, { roomName: req.body.roomName});
  if(roomIndex == -1 && req.body.roomName !== ""){
    var newRoom = {
      '_id' : roomsCount,
      'roomName' : req.body.roomName, // 방 제목
      'roomMoney' : Number(req.body.roomMoney), // 방의 판돈
      'roomUserNumber' : req.body.roomUserNumber, // 방의 참여인원
      'roomAllMoney' : 0, // 방의 배팅금
      'connUsers' : [], // 방에 들어온 사람들
      'disconnUsers' : [], // 게임 도중에 나간 사람들 체크
      'gamingUsers' : [], // 게임의 참여자들
      'deadUsers' :[], // 게임의 죽은 유저
      'currentTurnUser': '',
      'state' : '대기중',
      'cards' : [],
      'bettingStage' : 0,
      'regame' : 0, // 리게임
      'count' : 0 // 참여한 사람이 한번씩 돌아가면서 돌릴 수 있도록 카운트해준다
    };
    rooms.push(newRoom);
    roomIndex = _.findIndex(rooms, { _id: roomsCount});
    roomsCount++;
    addUser(roomIndex, req.user);

    res.render('Game/GameRoom', {room: newRoom});
  } else{
    req.flash('danger', '다시 입력헤주세요');
    return res.redirect('back');
  }
});

router.get('/:id', needAuth, function(req,res, next){
  roomIndex = _.findIndex(rooms, { _id: Number(req.params.id)});
  var selectedRoom = rooms[roomIndex];
  if(selectedRoom.connUsers.length < rooms[roomIndex].roomUserNumber && selectedRoom.state == "대기중"){
    // 원래 이렇게 해야함.
    addUser(roomIndex, req.user);
    res.render('Game/GameRoom', {room: selectedRoom});
  } else {
    req.flash('danger', '방을 들어갈 수 없습니다.');
    return res.redirect('back');
  }
});

function addUser(roomIndex, user){
  rooms[roomIndex].connUsers.push({
    'userID' : (user._id).toString(),
    'userName' : user.userName,
    'isReady' :  false,
    'photoURL' : user.photoURL,
    'cards' : [],
    // 여기 부분은 디비에 있는것을 집어넣어준다.
    'insignia' : user.insignia,
    'win' : user.win,
    'lose' : user.lose,
    'money' : user.money
  });
}
module.exports = router;
