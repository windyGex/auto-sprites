var path = require('path'),
    nodeImages = require('node-images'),
    fs = require('fs'),
    asyncUtil = require('./util'),
    crypto = require('crypto');
    ;

var MergeImage = function (config) {
    this.rulesResult = config.rulesResult;
    //标识合并的类型
    this.type = config.type;
    this._imageMetaCache = {};
    this.path = config.path;
    this.root = config.root;
    this.fileName = config.fileName;
};

MergeImage.prototype = {

    constructor: MergeImage,

    parse: function (callback) {
        var self = this;

        asyncUtil.forEach(this.rulesResult, function (url, smartItem, next) {
            var imageMeta = {}, size;

            if (self._imageMetaCache[url]) {
                imageMeta = self._imageMetaCache[url];
                size = self.getRulesMaxSize(smartItem, imageMeta);
                smartItem.w = size.w;
                smartItem.h = size.h;
                smartItem.imageMeta = imageMeta;
                next();
            } else {
               try {
                    console.log('Get css background ---> '+ url );
                    var png = nodeImages(url);
                    if (png) {
                        imageMeta.image = png;
                        imageMeta.width = png.size().width;
                        imageMeta.height = png.size().height;
                        size = self.getRulesMaxSize(smartItem, imageMeta);
                        smartItem.w = size.w;
                        smartItem.h = size.h;
                        self._imageMetaCache[url] = imageMeta;
                        smartItem.imageMeta = imageMeta;
                        next();
                    }
                } catch (e) {
                    console.log(e.message);
                    next();
                }


            }
        }, function () {
            self.savePng(self.rulesResult, callback);
        });
    },
    getRulesMaxSize: function (smartItem, imageMeta) {
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

    savePng: function (result, callback) {
        var resultPosition = this.getPosition(result),
            self = this;


        asyncUtil.forEach(resultPosition, function (index, position, next) {


            var spritesImage = self.createPng(position.root.w, position.root.h);
            if (spritesImage) {


                var imageUrl = path.join(self.path , crypto.createHash('md5').update(self.fileName + '-' + self.type).digest("hex").substring(0,8) + '.png').split(path.sep).join('/'),
                    spritesImageName  = path.join( self.root , imageUrl);

                console.log('Save Image to ---> '+ spritesImageName );

                asyncUtil.forEach(position, function (index, style, go) {

                    var imageMeta = style.imageMeta,
                        image;
                    if (imageMeta) {
                        image = imageMeta.image;
                        imageMeta.fit = style.fit;
                        imageMeta.hasDraw = true;
                        imageMeta.imageName = imageUrl;
                        self.replaceBackgroundInfo(imageUrl, style);

                        spritesImage.draw(image, imageMeta.fit.x, imageMeta.fit.y);
                    }
                    go();
                }, function () {
                    self.makeDirSync(path.dirname(spritesImageName));

                    spritesImage.save(spritesImageName);

                    next();

                });

            } else {
                next();
            }
        }, callback);


    },

    createPng: function (w, h) {

        return nodeImages(w, h);
    },

    getPosition: function (result) {
        var Packer,
            hasDrawImages = [],
            newDrawImages = [],
            item,
            drawImages = [],
            sort;
        if (this.type == 'smart') {
            Packer = require('./growing-packer');
            sort = function (a, b) {
                return b.w * b.h - a.w * a.h;
            }
        } else {
            Packer = require('./' + this.type + '-packer');
            if (this.type == 'vertical') {
                sort = function (a, b) {
                    return a.h < b.h;
                }
            } else {
                sort = function (a, b) {
                    return a.w < b.w;
                }
            }
        }
        packer = new Packer();

        for (var key in result) {
            if (result.hasOwnProperty((key)) && key != 'length') {
                item = result[key];
                if (item.imageMeta) {
                    if (item.imageMeta.hasDraw) {
                        hasDrawImages.push(item);
                    } else {
                        newDrawImages.push(item);
                    }
                }
            }
        }
        if (newDrawImages.length) {
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

    makeDirSync: function (dirpath, mode) {
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

            var bgImage = 'url(' + imageUrl + ')',
                bgPosition,
                bgColor = rule.getPropertyValue('background-color'),
                bgRepeat = rule.getPropertyValue('background-repeat'),
                positionX,
                positionY;

            var position = rule['background-position'];
            if (position) {
                position = position.replace(/px/g, '');
                position = position.split(' ');
                position[0] = parseInt(position[0], 10);
                position[1] = parseInt(position[1], 10);
            } else {
                position = [0, 0];
            }

            positionX = (position[0] - style.fit.x);
            positionY = (position[1] - style.fit.y);

            bgPosition = (positionX == 0 ? 0 + ' ' : positionX + 'px ') +
                (positionY == 0 ? 0  : positionY + 'px');


            //合并样式 替换成background的形式
            rule.removeProperty('background-layout');
            rule.removeProperty('background-position');
            rule.removeProperty('background-color');
            rule.removeProperty('background-image');
            rule.removeProperty('background-repeat');
            rule.setProperty('background',bgColor+' '+bgImage+' '+bgPosition+' '+bgRepeat);

        });
    }

};

module.exports = MergeImage;