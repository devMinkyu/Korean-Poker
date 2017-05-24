// $.when(drawCards).then(function (){
    //     $(".moneypanel").fadeIn();
    //     $(".cards").transition({ 
    //         perspective: '100px',
    //         rotateY: '180deg'
    //     });
    // });
    // $.when(drawCards).then(function (){
    //      $(".mycards").fadeIn();
    //       var myCardsDirection = 0
    //       var myCardsDirectionCounter = 0;
    //         var checkMyCards = $('.mycards').each(function(index) {
    //             $(this).delay(1*index).animate(myCardsDirection);
    //             if(myCardsDirectionCounter == 0 ){
    //                 myCardsDirection = {left: "+=8%"}
    //                 myCardsDirectionCounter++
    //             }else if(myCardsDirectionCounter ==1){
    //                 myCardsDirection = {left: "+=16%"}
    //             }
    //         });
    //         $.when(checkMyCards).then(function (){
    //             $(".mycards").transition({ 
    //                 perspective: '100px',
    //                 rotateY: '180deg'
    //             });
    //             $(".mycards").attr('src','/images/card/Untitled-3_11.png');
    //         });
    //     });

$.fn.draw = function (player) {
    var direction = {left: "+=45%", bottom: "+=22%"}
    var directionCount = 0 //주는 카드 방향 지정
    var drawCards = $('.cards').each(function(index) {
                        $(this).delay(50*index).animate(direction)
                        if(directionCount == 0){
                            direction = {left: "+=45%", bottom: "-=35%"}
                            directionCount++
                        }else if(directionCount == 1){ //3번 플레이어
                            direction = {left: "-=35%", bottom: "-=35%"}
                            directionCount++
                        }else if(directionCount == 2){//4번 플레이어
                            direction = {left: "-=35%", bottom: "+=22%"}
                            directionCount++
                        }
    });
}