var //gd = require('node-gd'),
    fs = require('fs'),
    asyncUtil = require('./util');

var base64 = {

    _base64Cache:{},

    parse:function(object,next){
        var self = this;
        asyncUtil.forEach(object,function(url,smartItem,go){
            if(self._base64Cache[url]){
                 self.replace(smartItem,self._base64Cache[url]);
                 go();
            }else{
                fs.readFile(url,function(error,data){

                    if(error){
                        go();
                    }else{
                        self.replace(smartItem,data);
                        self._base64Cache[url] = data;
                        go();
                    }
                });
           }
        },next);
    },
    replace:function(smartItem,data){
       smartItem.cssRules.forEach(function(style){
           style.setProperty('background-image','url(data:image/png;base64,'+new Buffer(data).toString('base64')+')');
       });
    }
};
module.exports = base64;