var VerticalPacker = function () {

};
//理论上垂直的合并只需要高度
VerticalPacker.prototype = {
    constructor: VerticalPacker,
    //[w:10,h:10]
    fit: function (blocks) {
        var n, node, block, len = blocks.length;
        var w = len > 0 ? blocks[0].w : 0;
        var h = len > 0 ? blocks[0].h : 0;
        // this.root = { x: 0, y: 0, w: w, h: h };
        for (n = 0; n < len; n++) {
            block = blocks[n];

            if (!this.root) {
                this.root = {x: 0, y: 0, w: block.w, h: block.h};
                block.fit = this.root;
            } else {
                this.root = {
                    x: 0,
                    y: 0,
                    w: this.root.w + Math.abs(this.root.w - block.w),
                    h: this.root.h + block.h,
                    down: {
                        x: 0,
                        y: this.root.h,
                        w: block.w,
                        h: block.h
                    }
                }
                block.fit = this.root.down;
            }
        }
    }
}

module.exports = VerticalPacker;