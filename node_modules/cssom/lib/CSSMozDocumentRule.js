//.CommonJS
var CSSOM = {
	CSSStyleDeclaration: require("./CSSStyleDeclaration").CSSStyleDeclaration,
	CSSRule: require("./CSSRule").CSSRule
};
///CommonJS


/**
 * @constructor
 * @see http://dev.w3.org/csswg/cssom/#css-font-face-rule
 */
CSSOM.CSSMozDocumentRule = function CSSMozDocumentRule() {
	CSSOM.CSSRule.call(this);
    this.cssRules = [];
};

CSSOM.CSSMozDocumentRule.prototype = new CSSOM.CSSRule;
CSSOM.CSSMozDocumentRule.prototype.constructor = CSSOM.CSSMozDocumentRule;
CSSOM.CSSMozDocumentRule.prototype.type = 10;
//FIXME
//CSSOM.CSSFontFaceRule.prototype.insertRule = CSSStyleSheet.prototype.insertRule;
//CSSOM.CSSFontFaceRule.prototype.deleteRule = CSSStyleSheet.prototype.deleteRule;

// http://www.opensource.apple.com/source/WebCore/WebCore-955.66.1/css/WebKitCSSFontFaceRule.cpp
CSSOM.CSSMozDocumentRule.prototype.__defineGetter__("cssText", function() {

    var cssTexts = [];
    for (var i=0, length=this.cssRules.length; i < length; i++) {
        cssTexts.push(this.cssRules[i].cssText);
    }


	return "@-moz-document url-prefix() {\n" + cssTexts.join("") + "\n}";
});


//.CommonJS
exports.CSSMozDocumentRule = CSSOM.CSSMozDocumentRule;
///CommonJS
