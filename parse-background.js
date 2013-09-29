var util = require('pegasus').util,

    path = require('path'),

    backgroundRegExp = [
        {
            reg: /none/,
            callback: function (result) {
                return false;
            }
        },
        {
            reg: /(url\(['"]?.*?['"]?\))/,
            callback: function (result, match) {
                result['background-image'] = match[0];
            }
        },
        { //匹配background-position
            //50% 50%
            //left bottom
            //10px 10px
            reg: /([0-1][0-9]{0,2}%|left|right|center|0|\d+px)\s+([0-1][0-9]{0,2}%|top|center|bottom|0|\d+px)/,
            callback: function (result, match) {
                result['background-position'] = match[0];
            }
        },
        { //匹配background-repeat
            //no-repeat
            //repeat
            //repeat-x
            //repeat-y
            reg: /no-repeat|repeat-x|repeat-y|repeat/,
            callback: function (result, match) {
                result['background-repeat'] = match[0];
            }
        },
        { //http://www.w3schools.com/cssref/css_colors_legal.asp
            //匹配数字颜色的正则
            reg: /(#([0-9a-f]{3}|[0-9a-f]{6})\b)/,
            callback: function (result, match) {
                result['background-color'] = match[0];
            }
        },
        {
            //匹配rgb的颜色的正则
            reg: /rgb\([0-9]{0,3}\,[0-9]{0,3}\,[0-9]{0,3}\)/,
            callback: function (result, match) {
                result['background-color'] = match[0];
            }
        },
        { //匹配rgba的颜色的正则
            reg: /rgba\([0-9]{0,3}\,[0-9]{0,3}\,[0-9]{0,3}\,0?\.[0-9]{1}\)/,
            callback: function (result, match) {
                result['background-color'] = match[0];
            }
        },
        {
            reg: /qua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|purple|red|silver|teal|white|yellow|orange|transparent/,
            callback: function (result, match) {
                result['background-color'] = match[0];
            }
        }
    ],
    bgImageReg = /url\s*\(\s*(["']?)([^"']+?\.(?:png)(?:\?[^"']+?)?)\1\s*\)/;

var ParseRules = util.inherit(Object, {

    _initialize: function (config) {
        this.cssRules = config.cssRules;
        this.root = config.root;
    },
    //获取background的信息
    //拆分成详细书写的格式
    // background-image
    // background-position
    // background-color
    // background-repeat
    getBackgroundInfo: function (background) {
        var result = {};
        backgroundRegExp.forEach(function (regExpItem) {
            var regExp = regExpItem.reg,
                match,
                callback = regExpItem.callback;
            if (match = background.match(regExp)) {
                if (callback(result, match) === false) {
                    return false;
                }
            }
        });
        return result;
    },
    mergeStyle: function (style, result) {
        console.log(result);
        for (var key in result) {
            if (result.hasOwnProperty(key)) {
                //忽略已经存在的属性
                if (style[key]) {
                    continue;
                }
                style.setProperty(key, result[key], "");
            }
        }
        style.removeProperty('background');
    },
    //只接受png格式的本地文件
    //对于使用http开头的文件忽略掉
    getImageURL: function (bgImage) {
        var url = bgImage.match(bgImageReg);
        if (url) {
            url = url[2];
            //去除掉http引用的情况
            url = url.replace(/(http:\/\/.*)(\/simg\/.*)/, function ($1, $2, $3) {
               return $3;
            });
            url = url.replace(/(http:\/\/.*)(\/wimg\/.*)/, function ($1, $2, $3) {
                return $3;
            });
            //去除掉携带参数的情况，时间戳
            url = url.replace(/\?.*$/, '');
            //获取图片的真实路径
            url = path.join(this.root, path.normalize(url));
            if (url.indexOf('simg') > 0 || url.indexOf('wimg') > 0) {
                return url;
            }
        }
    },
    //获取拼图方式的类型
    getLayoutType: function (style) {
        var layout,
            repeat = style['background-repeat'],
            importantLayout = style['background-layout'];
        if (importantLayout) {
            return importantLayout;
        }
        if (repeat === 'repeat-x') {
            layout = 'vertical';
        }
        else if (repeat === 'repeat-y') {
            layout = 'horizontal';
        } else if (repeat === 'no-repeat') {
            layout = 'smart';
        }
        return layout;
    },

    parse:function(){
        return this.parseCSSRules(this.cssRules);
    },

    parseCSSRules: function (cssRules, result) {
        var self = this;
        result = result || {
            //repeat-x
            'vertical': {
                length: 0
            },
            //repeat-y
            'horizontal': {
                length: 0
            },
            //no-repeat
            'smart': {
                length: 0
            },
            //对角线拼图
            'diagonal': {
                length: 0
            },
            length:4
        };
        cssRules.forEach(function (rule) {
            var style = rule.style, layout, imageURL;
            //@media
            //@-moz-document url-prefix()
            if (rule.cssRules) {
                self.parseCSSRules(rule.cssRules, result);
            } else {
                if (!style) {
                    return;
                }
                if (style.background) {
                    var parseResult = self.getBackgroundInfo(style.background);
                    self.mergeStyle(style, parseResult);
                    style.removeProperty('background');
                }

                if (style['background-image']) {
                    if (style['background-repeat'] == 'repeat' || !style['background-repeat'] || style['background-position'].match(/center/)) {
                        return;
                    }
                    layout = self.getLayoutType(style);
                    imageURL = self.getImageURL(style['background-image']);
                    if (imageURL) {
                        if (!result[layout]) {
                            result[layout] = {
                                length: 0
                            };
                        }
                        if (!result[layout][imageURL]) {
                            result[layout][imageURL] = {
                                url: imageURL,
                                cssRules: []
                            };
                            result[layout].length++;
                        }
                        result[layout][imageURL].cssRules.push(style);
                    }
                }
            }
        });

        return result;
    }
});

module.exports = ParseRules;