function cardAnimation(userNumber){
    var direction = {left: "+=70%", bottom: "+=9%"}
    var directionCount = 0 //주는 카드 방향 지정
    var moveLeftCount = 0 // 받는 카드를 세장씩 정렬
    
    var drawCards = $('.cards').each(function(index) {
      $(this).delay(300*index).animate(direction)
      if(directionCount == 0){
          if(moveLeftCount == 0 ){// 2번 플레이어
              direction = {left: "+=70%", bottom: "-=53%"}
              directionCount++
          }else if(moveLeftCount ==1){
              direction = {left: "+=60%", bottom: "-=53%"}
              directionCount++
          }
      }else if(directionCount == 1 && userNumber > 2){ //3번 플레이어
          if(moveLeftCount == 0 ){
              direction = {left: "-=60%", bottom: "-=53%"}
              directionCount++
          }else if(moveLeftCount ==1){
              direction = {left: "-=50%", bottom: "-=53%"}
              directionCount++
          }
      }else if(directionCount == 2  && userNumber > 3){//4번 플레이어
          if(moveLeftCount == 0 ){
              direction = {left: "-=60%", bottom: "+=9%"}
              directionCount++
          }else if(moveLeftCount ==1){
              direction = {left: "-=50%", bottom: "+=9%"}  
              directionCount++
          }
      }
      else{//1번 플레이어
          if(moveLeftCount == 0 ){
              direction = {left: "+=60%", bottom: "+=9%"}
              directionCount = 0
              moveLeftCount++
          }
      }
    });

    $.when(drawCards).then(function (){
        $(".moneypanel").fadeIn();
        $(".cards").transition({ 
            perspective: '100px',
            rotateY: '180deg'
        });
    });

    $.when(drawCards).then(function (){
         $(".mycards").fadeIn();
          var myCardsDirection = 0
          var myCardsDirectionCounter = 0;
            var checkMyCards = $('.mycards').each(function(index) {
                $(this).delay(10*index).animate(myCardsDirection);
                if(myCardsDirectionCounter == 0 ){
                    myCardsDirection = {left: "+=8%"}
                    myCardsDirectionCounter++
                }else if(myCardsDirectionCounter ==1){
                    myCardsDirection = {left: "+=16%"}
                }
            });
            $.when(checkMyCards).then(function (){
                $(".mycards").transition({ 
                    perspective: '100px',
                    rotateY: '180deg'
                });
            });
        });
    }

function cardAnimationThird(userNumber){
  var direction = {left: "+=50%", bottom: "+=0%"}
  var directionCount = 0 //주는 카드 방향 지정
  var drawCards = $('.lastCards').each(function(index) {
    $(this).delay(300*index).animate(direction)
    if(directionCount == 0){
        direction = {left: "+=50%", bottom: "-=62%"}
        directionCount++
    }else if(directionCount == 1 && userNumber > 2){ //3번 플레이어
        direction = {left: "-=40%", bottom: "-=62%"}
        directionCount++
    }else if(directionCount == 2 && userNumber > 3){//4번 플레이어
        direction = {left: "-=40%", bottom: "+=0%"}
        directionCount++
    }
  });

      $.when(drawCards).then(function (){
        $(".moneypanel").fadeIn();
        $(".lastCards").transition({ 
            perspective: '100px',
            rotateY: '180deg'
        });
    });

    $.when(drawCards).then(function (){
         $(".mycards").fadeIn();
          var myCardsDirection = 0
          var myCardsDirectionCounter = 0;
            var checkMyCards = $('.mycards').each(function(index) {
                $(this).delay(10*index).animate(myCardsDirection);
                if(myCardsDirectionCounter == 0 ){
                    myCardsDirection = {left: "+=8%"}
                    myCardsDirectionCounter++
                }else if(myCardsDirectionCounter ==1){
                    myCardsDirection = {left: "+=16%"}
                    myCardsDirectionCounter++
                }else if(myCardsDirectionCounter ==2){
                    myCardsDirection = {left: "+=24%"}
                }
            });
            $.when(checkMyCards).then(function (){
                $(".mycards").transition({ 
                    perspective: '100px',
                    rotateY: '180deg'
                });
            });
        });
}