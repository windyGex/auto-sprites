auto-sprites
============

一个自动合并CSS图片的天马模块


Auto Sprites原本设计为天马的一个模块，但是由于出于实时合并的效率和稳定性，决定把其作为UCC编译器的一部分进行工作，所以现在独立为第三方的模块。

## 安装

    npm install auto-sprites -g

## 使用

    sprites <root> <source> <target> <sprites> [base64] [level]

* `root` 文件存放的根目录，比如htdocs

* `source` 指定编译的文件夹，比如/css/6v

* `target` 指定编译后文件存放的位置 比如/css/6v

* `sprites` 指定图片文件存放的位置 比如/simg

* `base64`是否启用base64编码

* `level` 以文件或者文件夹的维度合并图片,默认值为`file`

## 支持合并方式

* 垂直合并

* 水平合并

* 对角线合并

* 紧凑合并

## CSS书写要求

由于无法解析组合类，所以建议图片和样式书写在一个样式里面，另外无法找到的图片将被忽略。

## 更新日志

2014-04-22 : 修复注释解析错误的问题，修复sprites命令base64参数解析的问题
2014-01-21 : 修复windows下路径替换错误的问题
2013-11-19 ：修复注释解析错误的问题
