$(function(){
    var direction = {left: "+=60%"}
    var directionCount = 0
    var moveLeftCount = 0
    var drawCards = $('.cards').each(function(index) {
                        $(this).delay(300*index).animate(direction)
                        if(directionCount == 0){
                            if(moveLeftCount == 0 ){
                                direction = {bottom: "-=60%"}
                                directionCount++
                            }else if(moveLeftCount ==1){
                                direction = {bottom: "-=60%", left: "+=10%"}
                                directionCount++
                            }else if(moveLeftCount ==2){
                                direction = {bottom: "-=60%", left: "+=20%"}
                                directionCount++
                            }
                        }else if(directionCount == 1){
                            if(moveLeftCount == 0 ){
                                direction = {left: "-=80%"}
                                directionCount++
                            }else if(moveLeftCount ==1){
                                direction = {left: "-=70%"}
                                directionCount++
                            }else if(moveLeftCount ==2){
                                direction = {left: "-=60%"}
                                directionCount++
                            }
                        }else if(directionCount == 2){
                            if(moveLeftCount == 0 ){
                                direction = {bottom: "+=60%"}
                                directionCount++
                            }else if(moveLeftCount ==1){
                                direction = {bottom: "+=60%", left: "+=10%"}
                                directionCount++
                            }else if(moveLeftCount ==2){
                                direction = {bottom: "+=60%", left: "+=20%"}
                                directionCount++
                            }
                        }
                        else if(directionCount == 3){
                            if(moveLeftCount == 0 ){
                                direction = {left: "+=70%"}
                                directionCount = 0
                                moveLeftCount++
                            }else if(moveLeftCount ==1){
                                direction = {left: "+=80%"}
                                directionCount = 0
                                moveLeftCount++
                            }
                        }
    });
    $.when(drawCards).then(function (){
        $(".img:nth-child(3)").flip();

        // $(".img:nth-child(1)").fadeIn().queue(function() {
        //     $(".img:nth-child(2)").fadeIn().queue(function() {
        //         $(".img:nth-child(3)").fadeIn();
        //     });
        // });
    });
});


//left: 534


// $(function(){
//     var direction = {left: "+=60%"}
//     var directionCount = 0
//     $('.cards').each(function(index) {
//         $(this).delay(200*index).animate(direction,{complete: function(){
//             $(".img:nth-child(1)").fadeIn().queue(function() {
//                 $(".img:nth-child(2)").fadeIn().queue(function() {
//                     $(".img:nth-child(3)").fadeIn();
//                 });
//             });
//         }});
//         if(directionCount == 0){
//             direction = {bottom: "-=60%"}
//             directionCount++
//         }else if(directionCount == 1){
//             direction = {left: "-=60%"}
//             directionCount++
//         }else if(directionCount == 2){
//             direction = {bottom: "+=60%"}
//             directionCount++
//         }
//         else if(directionCount == 3){
//             direction = {left: "+=60%"}
//             directionCount =0
//         }
//     });
// });



// //left: 534