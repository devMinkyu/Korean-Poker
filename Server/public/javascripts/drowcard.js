$(function(){
    $('.cards').animate({left: 534},{complete: function(){
        $(".img:nth-child(1)").fadeIn().queue(function() {
            $(".img:nth-child(2)").fadeIn().queue(function() {
                $(".img:nth-child(3)").fadeIn();
            });
        });
    }})
});
