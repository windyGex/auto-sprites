var util = require('pegasus').util,
    path = require('path'),
    gd = require('node-gd'),
    fs = require('fs'),
    asyncUtil = require('./util');


/**
 *
 *
 * url{
 *          url://
 *          cssRules://
 * }
 *
 */
var MergeImage = util.inherit(Object, {
    _initialize: function (config) {
        this.rulesResult = config.rulesResult;
        //标识合并的类型
        this.type = config.type;
        this._imageMetaCache = {};
        this.path = config.path;
        this.root = config.root;
        this.fileName = config.fileName;
    },
    parse: function (callback) {
        var self = this;
        asyncUtil.forEach(this.rulesResult,function(url,smartItem,next){
            var imageMeta = {},size;
            if(self._imageMetaCache[url]){
                imageMeta = self._imageMetaCache[url];
                size = self.getRulesMaxSize(smartItem,imageMeta);
                smartItem.w = size.w;
                smartItem.h = size.h;
                smartItem.imageMeta = imageMeta;
                next();
            }else{
                gd.openPng(url, function (err, png) {
                    if (err) {
                        next();
                    } else {
                        if (png) {
                            imageMeta.image = png;
                            imageMeta.width = png.width;
                            imageMeta.height = png.height;
                            size = self.getRulesMaxSize(smartItem,imageMeta);
                            smartItem.w = size.w;
                            smartItem.h = size.h;
                            self._imageMetaCache[url] = imageMeta;
                            smartItem.imageMeta = imageMeta;
                            next();
                        }
                    }
                });
            }
        },function(){
            self.savePng(self.rulesResult,callback);
        });
    },
    getRulesMaxSize:function(smartItem,imageMeta){
        var w = 0,
            h = 0,
            imageWidth = imageMeta.width,
            imageHeight = imageMeta.height;
        smartItem.cssRules.forEach(function (cssRule) {
            w = parseInt(cssRule.width),
                h = parseInt(cssRule.height);
            if (w > imageWidth) {
                imageWidth = w;
            }
            if (h > imageHeight) {
                imageHeight = h;
            }
        });

        return{
            w: imageWidth,
            h: imageHeight
        }
    },

    savePng:function(result,callback){
        var resultPosition = this.getPosition(result),
            self = this;

        asyncUtil.forEach(resultPosition,function(index,position,next){

            var spritesImage = self.createPng(position.root.w, position.root.h);
            if (spritesImage) {

                var imageUrl = self.path + self.fileName + '-'+self.type+'.png',
                    spritesImageName = self.root + imageUrl;

                asyncUtil.forEach(position,function(index,style,go){

                    var imageMeta = style.imageMeta,
                        image;
                    if(imageMeta){
                        image = imageMeta.image;
                        imageMeta.fit = style.fit;
                        imageMeta.hasDraw = true;
                        imageMeta.imageName = imageUrl;
                        self.replaceBackgroundInfo(imageUrl,style);
                        image.copyResampled(spritesImage, imageMeta.fit.x,
                            imageMeta.fit.y, 0, 0, image.width,
                            image.height, image.width, image.height);
                    }
                    go();
                },function(){
                    self.makeDirSync(path.dirname(spritesImageName)) ;
                    spritesImage.savePng(spritesImageName, 8, function (err) {
                        next();
                    });

                });

            }else{
                next();
            }
        },callback);

    },

    createPng: function (w, h) {
        var img = gd.createTrueColor(w, h);
        if (img) {
            transparent = //format == "gif" && img.colorAllocate(112, 121, 211) ||
                img.colorAllocateAlpha(0, 0, 0, 127);
            img.fill(0, 0, transparent);
            img.colorTransparent(transparent);
            //if(format == "png"){
            img.alphaBlending(0);
            img.saveAlpha(1);
        }
        //}
        return img;
    },

    getPosition:function(result){
        var Packer,
            hasDrawImages = [],
            newDrawImages = [],
            item,
            drawImages = [],
            sort;
        if(this.type == 'smart'){
            Packer = require('./growing-packer');
            sort = function(a,b){
                return b.w * b.h - a.w * a.h;
            }
        }else{
            Packer = require('./'+this.type+'-packer');
            if(this.type == 'vertical'){
                sort = function(a,b){
                    return a.h < b.h;
                }
            }else{
                sort = function(a,b){
                    return a.w < b.w;
                }
            }
        }
        packer = new Packer();

        for(var key in result){
            if (result.hasOwnProperty((key)) && key != 'length') {
                item = result[key];
                if (item.imageMeta && item.imageMeta.hasDraw) {
                    hasDrawImages.push(item);
                } else {
                    newDrawImages.push(item);
                }
            }
        }
        if(newDrawImages.length){
            drawImages.push(newDrawImages);
        }

        drawImages.forEach(function (drawItem) {
            drawItem.sort(sort);
            packer.fit(drawItem);
            drawItem.root = packer.root;
        });

        if (hasDrawImages.length) {
            drawImages.push(hasDrawImages);
        }
        return drawImages;

    },

    makeDirSync:function(dirpath, mode){
        dirpath = path.resolve(dirpath);

        if (fs.existsSync(dirpath)) {
            return;
        }
        var dirs = dirpath.split(path.sep);

        var dir = '';
        for (var i = 0; i < dirs.length; i++) {
            dir += path.join(dirs[i], path.sep);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, mode);
            }
        }
    },

    replaceBackgroundInfo: function (imageUrl, style) {

        style.cssRules.forEach(function (rule) {
            rule.setProperty('background-image', 'url(' + imageUrl + ')', '');
            var position = rule['background-position'];
            if (position) {
                position = position.replace(/px/g, '');
                position = position.split(' ');
                position[0] = parseInt(position[0], 10);
                position[1] = parseInt(position[1], 10);
            } else {
                position = [0, 0];
            }
            rule.setProperty('background-position', (position[0] - style.fit.x) + 'px ' +
                (position[1] - style.fit.y) + 'px', '');
        });
    }


});

module.exports = MergeImage;