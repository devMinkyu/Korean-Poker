var User = require('../../models/User');
var _ = require('underscore');

exports.initialize =function(roomIndex){
  rooms[roomIndex].roomAllMoney = 0;
  rooms[roomIndex].gamingUsers = [];
  rooms[roomIndex].cards = [];
  rooms[roomIndex].regame = 0;
  rooms[roomIndex].bettingStage = 0;
  if(rooms[roomIndex].disconnUsers.length !== 0){
    var disUserIndex;
    for(var i = 0; i<rooms[roomIndex].disconnUsers.length;i++){
      disUserIndex = _.findIndex(rooms[roomIndex].connUsers, { userID: rooms[roomIndex].disconnUsers[i] });
      if(rooms[roomIndex].connUsers[disUserIndex].money === 0){
        rooms[roomIndex].connUsers[disUserIndex].money += 300000;
      }
      this.insigniaCheck(roomIndex, disUserIndex);
      this.userDataSave(rooms[roomIndex].connUsers[disUserIndex]);
      rooms[roomIndex].connUsers.splice(disUserIndex, 1);
    }
  }
  rooms[roomIndex].disconnUsers=[];
}
exports.insigniaCheck = function (roomIndex,userIndex){
  var user = rooms[roomIndex].connUsers[userIndex];
  if(user.money >= 1000000000){
    user.insignia = 4;
  } else if(user.money >= 100000000){
    user.insignia = 3;
  } else if(user.money >= 10000000){
    user.insignia = 2;
  } else if(user.money >= 5000000){
    user.insignia = 1;
  } else if(user.money < 5000000){
    user.insignia = 0;
  }
  rooms[roomIndex].connUsers[userIndex] = user;
}
exports.userDataSave = function (user){
  User.findOne({_id: user.userID},function(err, myUser){
      if (err) {
        return next(err);
      }
      myUser.win = user.win;
      myUser.lose = user.lose;
      myUser.money = user.money;
      myUser.insignia = user.insignia;
      myUser.save(function(err) {
        if (err) {
          return next(err);
        }
      });
  });
}
// 카드 두장을 주고 우선순위를 보내준다 숫자가 낮을수록 족보 순위가 높은거
exports.cardPriority = function (card1, card2){
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