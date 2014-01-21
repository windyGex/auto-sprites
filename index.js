var pegasus = require('pegasus'),
    path = require('path'),
    AutoSprites = require('./auto-sprites');

var autoSprites = pegasus.createPipe({
    _initialize:function(config){
        this.root = config.root;
        this.path = config.path;
        this.base64 = config.base64;

    },
    main:function(req,res){

        var self = this;

        if(res.head('content-type') == 'text/css'){


            this.autoSprites = new AutoSprites({
                data:res.body('utf-8'),
                root:this.root,
                path:this.path,
                fileName:req.path,
                base64:this.base64
            });

            this.autoSprites.parse(function(data){

                 res.clear()
                    .write(new Buffer(data, 'binary'));
                 self.next();
            });

        } else{

            self.next();
        }

    }
});

module.exports = autoSprites;