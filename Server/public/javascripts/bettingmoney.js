function firstBetting(i){
    var directionCount = 0; //주는 카드 방향 지정
    //배팅 머니 FadeIn
    var fadeInMoney = $('.parentMoney').children().fadeIn();
        if(i === 0){
            $('.bettingMoney1:last-child').animate({left: "-=33%"});
        }else if(i === 1){
            $('.bettingMoney2:last-child').animate({left: "-=33%"});
        } else if (i === 2){
            $('.bettingMoney3:last-child').animate({left: "+=35%"});
        } else if (i === 3){
            $('.bettingMoney4:last-child').animate({left: "+=35%"});
        }
}

    //각 플레이어의 배팅이 끝난 돈을 센터로 모은다.
    function combineMoney(player){//각 플레이어의 배팅이 다 되었다면 돈을 센터로 
        var collectCenter1=$('.bettingMoney1').animate({left: "-=10%", top:"+=210%"});  //1번 플레이어 돈 센터로
        var collectCenter2=$('.bettingMoney2').animate({left: "-=10%", top:"-=570%"}); //2번 플레이어 돈 센터로
        var collectCenter3=$('.bettingMoney3').animate({left: "+=9%", top:"-=570%"}); //3번 플레이어 돈 센터로
        var collectCenter4=$('.bettingMoney4').animate( {left: "+=9%" ,top:"+=210%"}); //4번 플레이어 돈 센터로
        var collectMoney =  $.when(collectCenter1,collectCenter2,collectCenter3,collectCenter4).then(function (){
            if(player === 1){ //1번 플레이어
                var winDirection = {left: "+=43%" , top: "-=210%"};
                $.when($('.parentMoney').children().animate(winDirection)).then(function (){
                    $('.parentMoney').children().remove();
                });
            }else if(player ===2){//2번 플레이어
                var winDirection = {left: "+=43%", top:"+=570%"};
                $.when($('.parentMoney').children().animate(winDirection)).then(function (){
                    $('.parentMoney').children().remove();
                });
            }else if(player ===3){//3번 플레이어
                var winDirection = {left: "-=43%", top: "+=570%"};
                $.when($('.parentMoney').children().animate(winDirection)).then(function (){
                    $('.parentMoney').children().remove();
                });
            }else if(player ===4){//4번 플레이어
                var winDirection = {left: "-=43%",  top: "-=210%"};
                $.when($('.parentMoney').children().animate(winDirection)).then(function (){
                    $('.parentMoney').children().remove();
                });
            }
        });
    }