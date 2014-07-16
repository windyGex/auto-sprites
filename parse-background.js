var path = require('path'),

// from peaches
// https://github.com/sliuqin/peaches.
    backgroundRegExp = [
        {
            reg: /none/,
            callback: function (result) {
                return false;
            }
        },
        {
            reg: /\?diagonal/,
            callback: function (result) {
                result['background-layout'] = 'diagonal';
            }

        },

        {
            reg: /\?ignore/,
            callback: function (result) {
                result['background-layout'] = 'ignore';
            }

        },

        {
            reg: /(url\(['"]?.*?['"]?\))/,
            callback: function (result, match) {
                //去除时间戳等其他标识
                var timeStampReg = /(\?.*)\)$/,
                    timeStampMatch = match[0].match(timeStampReg);
                if (timeStampMatch) {
                    result['background-image'] = match[0].replace(timeStampMatch[1], '');
                } else {
                    result['background-image'] = match[0];
                }
            }
        },
        { //匹配background-position
            //50% 50%
            //left bottom
            //10px 10px
            reg: /(-?\d+%|left|right|center|0|-?\d+px)\s+(-?\d+%|top|center|bottom|0|-?\d+px)/,
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
            reg: /(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b)/,
            callback: function (result, match) {
                result['background-color'] = match[0];
            }
        },
        {
            //匹配rgb的颜色的正则
            reg: /rgb\s*\(\s*[0-9]{0,3}\s*\,\s*[0-9]{0,3}\s*\,\s*[0-9]{0,3}\s*\)/,
            callback: function (result, match) {
                result['background-color'] = match[0];
            }
        },
        { //匹配rgba的颜色的正则
            reg: /rgba\s*\(\s*[0-9]{0,3}\s*\,\s*[0-9]{0,3}\s*\,\s*[0-9]{0,3}\s*\,\s*0?\.[0-9]{1}\s*\)/,
            callback: function (result, match) {
                result['background-color'] = match[0];
            }
        },
        {
            //If image url contains these words,may be make a mistake
            //eg background:url(test_white.png) no-repeat;
            //fix it
            reg: /qua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|purple|red|silver|teal|white|yellow|orange|transparent/,
            callback: function (result, match) {
                result['background-color'] = match[0];
            }
        }
    ],
// (quote)(url)(extname)(stamp)(quote)
    bgImageReg = /url\s*\(\s*(["']?)([^"']+?\.(?:png|gif|jpeg|jpg)(?:\?[^"']+?)?)\1\s*\)/;

var ParseRules = function (config) {
    this.cssRules = config.cssRules;
    this.root = config.root;
};

ParseRules.prototype = {

    constructor: ParseRules,
    //获取background的信息
    //拆分成详细书写的格式
    // background-image
    // background-position
    // background-color
    // background-repeat
    getBackgroundInfo: function (background) {
        var result = {}, backgroundReplace = background;
        backgroundRegExp.forEach(function (regExpItem) {
            var regExp = regExpItem.reg,
                match,
                callback = regExpItem.callback;
            if (match = backgroundReplace.match(regExp)) {
                if (callback(result, match) === false) {
                    return false;
                }
                backgroundReplace = backgroundReplace.replace(regExp, '');
            }
        });
        return result;
    },
    mergeStyle: function (style, result) {
        for (var key in result) {
            if (result.hasOwnProperty(key)) {
                //忽略已经存在的属性
                if (style[key]) {
                    continue;
                }
                style.setProperty(key, result[key], '');
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
            if(url.indexOf('http') == 0){
                return false;
            }
            //去除掉携带参数的情况，时间戳
            url = url.replace(/\?.*$/, '');
            //获取图片的真实路径
            url = path.join(this.root, path.normalize(url));
            return url;
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

    parse: function () {
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
            length: 4
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
                    if (style['background-repeat'] == 'repeat'
                        || !style['background-repeat']
                        || (style['background-position'] && style['background-position'].match(/center|right|bottom/))
                        || style['background-layout'] == 'ignore'
                        ) {
                        style.removeProperty('background-layout');
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
};


module.exports = ParseRules;