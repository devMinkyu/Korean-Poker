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

global.rooms = [];
global.roomsCount = 0;
global.name = null;
var count = 1;
router.get('/', function(req,res, next){
  res.render('Game/GameRoomList');
});
router.get('/create', function(req,res, next){
  res.render('Game/GameRoomCreate');
});

// router.post('/', needAuth, function(req, res, next){
router.post('/', function(req, res, next){
  var roomIndex = _.findIndex(rooms, { roomName: req.body.roomName})
  if(roomIndex == -1){
    var newRoom = {
      '_id' : roomsCount,
      'roomName' : req.body.roomName, // 방 제목
      'roomMoney' : Number(req.body.roomMoney), // 방의 판돈
      'roomUserNumber' : req.body.roomUserNumber, // 방의 참여인원
      'roomAllMoney' : 0, // 방의 배팅금
      'connUsers' : [], // 방에 들어온 사람들
      'gamingUsers' : [], // 게임의 참여자들
      'deadUsers' :[], // 게임의 죽은 유저
      'currentTurnUser': '',
      'state' : '대기중',
      'cards' : [],
      'regame' : 0,
      'count' : 0 // 참여한 사람이 한번씩 돌아가면서 돌릴 수 있도록 카운트해준다
    };
    rooms.push(newRoom);
    roomsCount++;
    addUser(newRoom._id, req.user._id, req.user.userName, req.user.photoURL);
    res.render('Game/GameRoom', {room: newRoom});
  } else{
    req.flash('danger', '똑같은 방이름이 있습니다.');
    return res.redirect('back');
  }
});

router.get('/:id', function(req,res, next){
  var index = req.params.id;
  var selectedRoom = rooms[index];
  if(selectedRoom.connUsers.length < 4 && selectedRoom.state == "대기중"){

    // 원래 이렇게 해야함.
    // addUser(selectedRoom._id, req.user._id, req.user.userName, , req.user.photoURL);

    // 테스트용
    var userTestID = "TEST" + count++;
    addUser(selectedRoom._id, userTestID, userTestID, "https://img1.daumcdn.net/thumb/R720x0.q80/?scode=mtistory&fname=http%3A%2F%2Fcfile27.uf.tistory.com%2Fimage%2F2466D94653EC5DBD29E64E");

    res.render('Game/GameRoom', {room: selectedRoom});
  } else {
    req.flash('danger', '방을 들어갈 수 없습니다.');
    return res.redirect('back');
  }
});

function addUser(roomIndex, userID, userName, photoURL){
  rooms[roomIndex].connUsers.push({
    'userID' : userID,
    'userName' : userName,
    'isReady' :  false,
    'photoURL' : photoURL,
    // 여기 부분은 디비에 있는것을 집어넣어준다.
    'win' : 0,
    'lose' : 0,
    'money' : 10000000000,
    'cards' : []
  });
}
module.exports = router;
