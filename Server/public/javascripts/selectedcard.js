$(function(){
    $('.mycards').click(function(){
        if(this.getAttribute("class").indexOf("image-selected") == -1){
        this.setAttribute("class", "image-selected");
        }else {
            this.setAttribute("class", "mycards");
        }
    })
});
