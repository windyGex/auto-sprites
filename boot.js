#!/usr/bin/env node

var AutoSprites = require('./auto-sprites'),
    fs = require('fs'),
    path = require('path');

var walker = function (filePath, callback) {
    var walkerSub = function (pathStr) {
        var directoryList = fs.readdirSync(pathStr);
        directoryList.forEach(function (item) {
            var pathJoinStr = path.join(pathStr, item);

            if (fs.statSync(pathJoinStr).isDirectory()) {
                walkerSub(pathJoinStr);
            } else {
                if (path.extname(pathJoinStr) == '.css') {
                    callback(pathJoinStr,item);
                }
            }
        });
    };
    walkerSub(filePath);
};



var getAllFilesData = function(source){
    var fileData = [],
        fileName = [],
        files = [];
    walker(source,function(file,name){
        fileData.push(fs.readFileSync(file));
        fileName.push(name);
        files.push(file);
    });
    return {
        name:fileName,

        data:fileData
    };
};

var makeDirSync = function (dirpath, mode) {
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
};

//main(['./source','/css','/target','/sprites']);
function main(args) {
    if (args.length < 4) {
        console.error('Usage: sprites <root>  <source>  <target>  <sprites> [base64] [level]');
        process.exit(1);
    }
    var root = args[0],
        source = args[1],
        target = args[2],
        imageSaveFolder = args[3],
        base64 = args[4] || false,
        //文件级别还是文件夹级别
        level = args[5] || 'file';

    if(level === 'file'){

         walker(path.join(root,source),function(file,name){
             var data = fs.readFileSync(file,'binary');
             new AutoSprites({
                 data:data,
                 root:root,
                 path:imageSaveFolder,
                 fileName:name,
                 base64:base64
             }).parse(function(data){
                    var writeFile = path.join(root,target,name);
                    makeDirSync(path.dirname(writeFile));
                    fs.writeFileSync(writeFile,data,'binary');
             });
         });
    }else{
        var files = getAllFilesData(path.join(root,source)),
            cssData = files.data.join('/*@split-auto-sprites@*/');

        new AutoSprites({
            data:cssData,
            root:root,
            path:imageSaveFolder,
            fileName:files.name.join(''),
            base64:base64
        }).parse(function(data){
                data = data.split('/*@split-auto-sprites@*/');

                data.forEach(function(cssDataItem,index){
                   var writeFile = path.join(root,target,files.name[index]);
                    makeDirSync(path.dirname(writeFile));
                    fs.writeFileSync(writeFile,cssDataItem,'binary');
                });
        });


    }

}
main(['./source','/css','/target','/sprites']);

