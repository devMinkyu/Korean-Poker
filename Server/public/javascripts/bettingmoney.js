$(function(){
    var directionCount = 0; //주는 카드 방향 지정
    //배팅 머니 FadeIn
    var fadeInMoney = $('.parentMoney').children().fadeIn();

    //각 플레이어의 배팅
    //1번 플레이어 배팅
    var bettingMoney1 = $.when(fadeInMoney).then(function (){
        $('.bettingMoney1').animate({left: "-=33%"});
    });
    //2번 플레이어 배팅
    var bettingMoney2 = $.when(fadeInMoney).then(function (){
        $('.bettingMoney2').animate({left: "-=33%"});
    });
    //3번 플레이어 배팅
    var bettingMoney3 = $.when(fadeInMoney).then(function (){
        $('.bettingMoney3').animate({left: "+=35%"});
    });
    //4번 플레이어 배팅
    var bettingMoney4 = $.when(fadeInMoney).then(function (){
         $('.bettingMoney4').animate({left: "+=35%"});
    });

    //각 플레이어의 배팅이 끝난 돈을 센터로 모은다.
    var collectCenter = $.when(bettingMoney1,bettingMoney2,bettingMoney3,bettingMoney4).then(function (){//각 플레이어의 배팅이 다 되었다면 돈을 센터로
        var collectCenter1=$('.bettingMoney1').animate({left: "-=10%", top:"+=210%"});  //1번 플레이어 돈 센터로
        var collectCenter2=$('.bettingMoney2').animate({left: "-=10%", top:"-=570%"}); //2번 플레이어 돈 센터로
        var collectCenter3=$('.bettingMoney3').animate({left: "+=9%", top:"-=570%"}); //3번 플레이어 돈 센터로
        var collectCenter4=$('.bettingMoney4').animate( {left: "+=9%" ,top:"+=210%"}); //4번 플레이어 돈 센터로
    });

    //각 플레이어로 부터 모은 돈을 승리한 플레이어에게 준다.
    var collectMoney =  $.when(collectCenter).then(function (){
        var player=4; // 승리한 플레이어의 넘버에 맞는 위치로 간다
        if(player === 1){ //1번 플레이어 
            var winDirection = {left: "+=43%" , top: "-=210%"};
            $.when($('.parentMoney').children().animate(winDirection)).then(function (){
                $('.parentMoney').children().hide();
            });
        }else if(player ===2){//2번 플레이어
            var winDirection = {left: "+=43%", top:"+=570%"};
            $.when($('.parentMoney').children().animate(winDirection)).then(function (){
                $('.parentMoney').children().hide();
            });
        }else if(player ===3){//3번 플레이어
            var winDirection = {left: "-=43%", top: "+=570%"};
            $.when($('.parentMoney').children().animate(winDirection)).then(function (){
                $('.parentMoney').children().hide();
            });
        }else if(player ===4){//4번 플레이어
            var winDirection = {left: "-=43%",  top: "-=210%"};
            $.when($('.parentMoney').children().animate(winDirection)).then(function (){
                $('.parentMoney').children().remove();
            });
        }
    });
});