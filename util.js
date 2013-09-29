function forEach(array, callback, end) {
    var self = this, keys = null;
    if ({}.toString.call(array) !== '[object Array]') {
        if ({}.toString.call(array) == '[object Object]') {
            keys = [];
            for (var i in array) {
                if (array.hasOwnProperty(i) && i != 'length') {
                    keys.push(i);
                }
            }
        } else {
            throw new Error('not an array or a object');
        }
    }
    var index = -1,
        count = (keys || array).length,
        next = function () {
            if (++index >= count) {
                end && end.call(self, count);
                return;
            }
            var key = keys ? keys[index] : index;
            callback && callback(key, array[key], next);
        };

    next();
}

exports.forEach = forEach;