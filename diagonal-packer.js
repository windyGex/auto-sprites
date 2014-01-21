var DialonalPacker = function(){

};
//自下而上的拼图
DialonalPacker.prototype = {

    constructor: DialonalPacker,

    //[w:10,h:10]
    fit:function(blocks){
        var n, block, len = blocks.length, prevBlock;


        // this.root = { x: 0, y: 0, w: w, h: h };
        for (n = 0; n < len ; n++) {

            block = blocks[n];

            if(!this.root){
                this.root = {
                    x:0,
                    y:0,
                    w:block.w,
                    h:block.h
                };

                block.fit = this.root;
            }else{
                this.root = {
                    x:0,
                    y:0,
                    w:block.w+this.root.w,
                    h:block.h+this.root.h,
                    rightTop:{
                        x:this.root.w,
                        y:0,
                        w:block.w,
                        h:block.h
                    }
                }
                block.fit = this.root.rightTop;
            }


            for(var j=0;j<n;j++){
                prevBlock = blocks[j];
                if(prevBlock.fit){
                    prevBlock.fit.y += block.h;
                }
            }
        }
    }
}

module.exports = DialonalPacker;