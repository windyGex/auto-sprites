var path = require('path'),
    fs = require('fs'),
    cssom = require('css-parser'),
    base64 = require('./base64'),
    ParseBackground = require('./parse-background'),
    asyncUtil = require('./util'),
    crypto = require('crypto'),
    MergeImage = require('./merge-image');


//.intelligent
function parseCSSRules(cssRules) {

    var result = {};

    cssRules.forEach(function (rule, index) {
        var selector = rule.selectorText;
        if (result[selector] == null) {
            result[selector] = index;
        }
        //尝试循环遍历已有的规则，将background回填到子类中
        for (var key in result) {
            if (result.hasOwnProperty(key)) {
                //符合情况
                var selectorText = cssRules[result[key]].selectorText;
                console.log(cssRules[result[key]].selectorText)
                if (selectorText && selectorText.indexOf(selector) > 0) {
                    //只有在自身的CSS规则没有background的情况下，才使用之前的background
                    if (cssRules[result[key]].style.background && !rule.style.getPropertyCSSValue('background')) {
                        //不能单纯的设置background，可能会影响到自身的 background-position 或者 background-image 的设定
                        //将background的值放在最前面，调整指针的位置，将其他的属性顺移一位
                        var insertRule = cssRules[result[key]].style.background,
                            insertRuleName,
                            tempRule = 'background';
                        for (var j = 0; j <= rule.style.length; j++) {
                            insertRuleName = rule.style[j];
                            rule.style[j] = tempRule;
                            tempRule = insertRuleName;
                        }
                        rule.style.background = insertRule;
                        rule.style.length++;

                        //rule.style.setProperty('background',cssRules[result[key]].style.background,'');
                    }
                    //只有在自身的CSS规则没有background-image的情况下，才使用之前的background-image
                    if (cssRules[result[key]].style['background-image'] && !rule.style.getPropertyValue('background-image')) {
                        rule.style.setProperty('background-image', cssRules[result[key]].style['background-image'], '');
                    }
                }
            }
        }
    });
    return cssRules;
}

/**
 *
 * @param config
 * @param config.data {Object} Css string data
 * @param config.path  {String} Image save position
 * @param config.root {String} Image root
 * @param config.fileName {String} Generate image name
 * @param config.base64 {Boolean} Use base64 encode
 * @constructor AutoSprites
 */
var AutoSprites = function (config) {
    this.data = config.data;
    this.path = config.path;
    this.fileName = this.getFileName(config.fileName);
    this.root = config.root;
    this.base64 = config.base64 || false;
};

AutoSprites.prototype = {

    constructor: AutoSprites,
    /**
     * Get image save name
     * @param fileName
     * @returns {*}
     */
    getFileName: function (fileName) {
        return  crypto.createHash('md5').update(fileName).digest("hex");
    },
    /**
     * Parse css then generate css sprites
     * @param callback {Function} After generate css sprites execute callback
     */
    parse: function (callback) {
        var cssDom = cssom.parse(this.data),
            cssRules = cssDom.cssRules,
            self = this;
        //parseCSSRules(cssRules);

        //根据规则分离出background的信息
        this.result = new ParseBackground({
            root: this.root,
            cssRules: cssRules
        }).parse();

        asyncUtil.forEach(this.result, function (type, object, next) {

            if (self.base64) {
                base64.parse(object, next);
            } else {
                new MergeImage({
                    path: self.path,
                    root: self.root,
                    fileName: self.fileName,
                    type: type,
                    rulesResult: object
                }).parse(function () {
                        next();
                });
            }
        }, function () {
            var data = cssDom.toString();
            callback(data);
        })
    }
};

module.exports = AutoSprites;