var path = require('path'),
    fs = require('fs'),
    cssom = require('cssom'),
    base64 = require('./base64'),
    ParseBackground = require('./parse-background'),
    util = require('pegasus').util,
    asyncUtil = require('./util'),
    MergeImage = require('./merge-image');



//.intelligent
function parseCSSRules(cssRules) {

    var result = {};

    cssRules.forEach(function (rule, index) {
        var selector = rule.selectorText;
        if(result[selector] == null){
            result[selector] = index;
        }
        //尝试循环遍历已有的规则，将background回填到子类中
        for (var key in result) {
            if (result.hasOwnProperty(key)) {
                //符合情况
                var selectorText =   cssRules[result[key]].selectorText;
                console.log(cssRules[result[key]].selectorText)
                if (selectorText && selectorText.indexOf(selector) > 0) {
                    //只有在自身的CSS规则没有background的情况下，才使用之前的background
                    if (cssRules[result[key]].style.background && !rule.style.getPropertyCSSValue('background')) {
                        //不能单纯的设置background，可能会影响到自身的 background-position 或者 background-image 的设定
                        //将background的值放在最前面，调整指针的位置，将其他的属性顺移一位
                        var insertRule = cssRules[result[key]].style.background,
                            insertRuleName,
                            tempRule = 'background';
                        for(var j = 0;j <= rule.style.length;j++){
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


var AutoSprites = util.inherit(Object, {


    _initialize: function (config) {
        this.data = config.data;
        this.path = config.path;
        this.files = config.files;
        this.fileName = this.getFileName(config.fileName);
        this.root = config.root;
        this.base64 = config.base64 || false;
    },

    getFileName: function (fileName) {
        //var fileName = '';
        //files.forEach(function(file){
        return fileName.replace(/^.*\/(.*\.css)$/,function ($1, $2) {
            return $2;
        }).replace('.css', '');
        //});
       // return fileName.substring(0, fileName.length - 1);
    },

    parse: function (callback) {
        var cssDom = cssom.parse(this.data),
            cssRules = cssDom.cssRules,
            self = this;



        //parseCSSRules(cssRules);

        //根据规则分离出background的信息
        this.result = new ParseBackground({
            root:this.root,
            cssRules:cssRules
        }).parse();


        asyncUtil.forEach(this.result,function(type,object,next){

            if(self.base64){

                base64.parse(object,next);

            }else{
                new MergeImage({
                    path:self.path,
                    root:self.root,
                    fileName:self.fileName,
                    type:type,
                    rulesResult:object
                }).parse(function(){
                        next();
                });
            }




        },function(){
            var data = cssDom.toString();
            callback(data);
        })


    }

});


module.exports = AutoSprites;