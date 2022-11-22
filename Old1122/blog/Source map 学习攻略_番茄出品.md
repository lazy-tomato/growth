# Source map 学习攻略\_番茄出品

## start

- 事情的起因：番茄我最近在学习如何调试 JavaScript，发现高频出现 Source map，但是我对它又不是很了解，经常造成学习上的阻塞。
- 随即就开始深入学习 `Source map`， 学习完毕，到如今写一篇博客记录收获。

## 一、从源码转换讲起

随着时代的发展，JavaScript 脚本正变得越来越复杂。大部分源码（尤其是各种函数库和框架）都要经过转换，才能投入生产环境。

常见的源码转换，主要是以下三种情况：

```
（1）压缩，减小体积。比如 jQuery 1.9 的源码，压缩前是 252KB，压缩后是 32KB。

（2）多个文件合并，减少 HTTP 请求数。

（3）其他语言编译成 JavaScript。
```

这三种情况，都使得线上实际运行的代码不同于开发时的代码，调试代码排查问题就变得困难重重。

通常，JavaScript 的解释器会告诉你，第几行第几列代码出错了。但是，这对于转换后的代码毫无用处。举例来说，jQuery@1.9 压缩后只有 3 行，每行 3 万个字符，所有内部变量都改了名字。你看着报错信息，感到毫无头绪，根本不知道它所对应的原始位置。

这就是 Source map 想要解决的问题。

`编译后的 Vue.js 的源码`
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/897d15c7a3944075952118a2c570788e~tplv-k3u1fbpfcp-watermark.image?)

## 二、什么是 Source map

简单来说 Source map 就是一个存储信息的文件，里面储存着位置信息。

> - Source map 英文释义：源程序映射。
> - 位置信息：`转换后的代码` 对应的 `转换前的代码` 位置映射关系。

有了 Source map，就算线上运行的是转换后的代码，调试工具中也可以直接显示转换前的代码。这极大的方便了我们开发者调试和排错。

## 三、如何使用 Source map

只要在转换后的代码尾部，加上一行如下代码即可。

```js
//# sourceMappingURL=main.js.map
```

`注意`

> - `=` 后的名称，依据对应 map 文件名定义；
> - map 文件可以放在网络上，也可以放在本地；

## 四、如何生成 Source map

### 4.1 概念

借助打包工具，在打包编译生成目标代码的同时，生成 Source map（_也就是目标代码和源代码的映射关系文件_）。

### 4.2 演示

我用比较常见的打包工具：webpack，来演示一下如何生成 Source map。

> NodeJs 请自行安装，版本需大于 8。

`1. 创建一个 main.js 文件`

```js
alert('tomato')
```

`2. 初始化项目 + 安装依赖`

```shell
npm init -y

npm i webpack@5 webpack-cli -D
```

`3. 创建一个 webpack.config.js 配置文件`

```js
const path = require('path')

module.exports = {
  // 1.入口文件  从那个文件打包入口文件（相对路径）
  entry: './main.js',

  // 2.输出内容
  output: {
    filename: 'main.js', // 一个是文件名
    path: path.resolve(__dirname, 'dist'), // 一个是输出路径（绝对路径）
  },

  // 3. 加载器
  // module: {
  //   rules: [],
  // },

  // 4. 插件
  // plugins: [],

  // 5. 配置
  devtool: 'source-map',

  // 6. 模式 // development
  mode: 'production',
}
```

`4. 目前的文件结构`

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/31ab3997b578434eb4f427c6ba040a47~tplv-k3u1fbpfcp-watermark.image?)

`5. 开始打包`

```shell
npx webpack
```

注意事项：

1. 示例中 webpack 使用的版本为 `webapck@5`。
2. 在 webpack 中，`devtool` 可以配置的属性值有很多，本次演示就以 `source-map` 为例。(_其他属性值后续会做讲解_)

`6. 输出：`

执行完上述命令后，会生成一个 dist 文件夹，其中有两个文件：

1. 目标文件：`main.js`
2. Source map 文件：`main.js.map`

## 五、Source map 文件介绍

### 5.1 文件结构

就以我们上述案例生成的 `main.js.map` 为例，我们来了解一下，它的内容结构是怎样的。

```json
{
  // version：Source map 的版本，目前为 3。
  "version": 3,

  // file：转换后的文件名。
  "file": "main.js",

  // sourceRoot：转换前的文件所在的目录。如果与转换前的文件在同一目录，该项为空。
  "sourceRoot": "",

  // sources：转换前的文件。该项是一个数组，表示可能存在多个文件合并。
  "sources": ["webpack://app/./main.js"],

  // sourcesContent：原始代码
  "sourcesContent": ["alert('tomato')\r\n"],

  // names：转换前的所有变量名和属性名。
  "names": ["alert"],

  // mappings：记录位置信息的字符串，下文详细介绍。
  "mappings": "AAAAA,MAAM"
}
```

Source map 文件类似 JSON 格式，它存在 7 个属性。

以下是对每个属性的解释：

1. version：Source map 的版本，目前为 3。

   > - Source map 也是从无到有逐渐发展过来的。对比新旧的版本，它们存储信息的编码方式存在差异。
   > - 目前主流的版本为 `3`， 它采用的编码方式是 `Base64 VLQ `，对标历史版本，文件体积精简很多。

2. file：转换后的文件名。

3. sourceRoot：转换前的文件所在的目录。

   > 如果与转换前的文件在同一目录，该项为空。

4. sources：转换前的文件。

   > 该项是一个数组，表示可能存在多个文件合并成一个目标文件。

5. sourcesContent：原始代码

   > `sourcesContent` 属性会存储对应的源代码。

6. names：转换前的所有变量名和属性名。

7. mappings：记录位置信息的字符串，。
   > 存储位置信息的属性，下文详细介绍。

### 5.2 mappings 介绍

#### 5.2.1 mappings 三个特点

mappings 本身是一个字符串，其中有三个特点：

1. 分号：每一个分号对应转换后源码的一行。
2. 逗号：每个逗号对应转换后代码的一个位置。
3. 字符：逗号或者分号之间的字符是以 Base64 VLQ 编码规则存储的位置信息。

举例来说，假定 mappings 属性的内容如下：

```json
"mappings":"AAAAA,BBBBB;CCCCC"
```

就表示：

1. 转换后的代码有两行。
2. 第一行有两个位置，第二行有一个位置。

#### 5.2.2 字符的五个位置？

例如 `AAAAA`， 它对应那些信息呢？

- 第一位，表示这个位置在（转换后的代码的）的第几列。

- 第二位，表示这个位置属于 sources 属性中的哪一个文件。

- 第三位，表示这个位置属于转换前代码的第几行。

- 第四位，表示这个位置属于转换前代码的第几列。

- 第五位，表示这个位置属于 names 属性中的哪一个变量。

#### 5.2.3 字符解析？

单纯存储 `A` 是没什么意义，我们重点关注 `A` 代表什么？

Source map 使用的是 Base64 VLQ 编码规则，具体的规则后续会写，目前直接演示转换结果：

`转换演示：`

```text
示例一:
AAAAA
[0,0,0,0,0]


示例二:
ubAAAA
[439,0,0,0,0]


示例三:
MAOA,MALAA,QAAQC,IAAI,GAKN,K
[6,0,7,0], [6,0,-5,0,0], [8,0,0,8,1], [4,0,0,4], [3,0,5,-6], [5]
```

`转换方法：`

用工具解析 [点击这里](http://murzwin.com/base64vlq.html)；

`注意事项：`

1. 注意，并不是一个**字母**对应一个位置。是一组字母表示一个位置。例如 `ubAAAA` 解析为： `[439,0,0,0,0]`；

2. 我自己学习到这里的时候，想到这么一个问题：所有的字母加特殊符号，就算考虑大小写，它们能记录的情况肯定是有限的，而任意一个源码，一行就有上万行。
   > 很显然一个字母对应一个位置，并不能记录上万行的内容，所以这里是一组字母对应一个位置。

#### 5.2.4 真实案例讲解映射关系

上方讲述了一些概念知识，但是概念不是很好理解，至少我是有些绕的，现在用实际案例去演示一下如何解析的。

> - **注意，为了节省空间，Source map 中使用的 Base64 VLQ 编码除了第一的字符外，剩余的计算都是相对位置的计算。**
>
> - 也就是相对于上次记录的位置的偏移量。

##### 5.2.4.1 案例一：

`源码：`

```js
alert('tomato')
```

`打包输出的代码：`

```js
alert('tomato')
//# sourceMappingURL=main.js.map
```

`打包输出的 Source map 文件：`

```js
{
  "version": 3,
  "file": "main.js",
  "mappings": "AAAAA,MAAM",
  "sources": [
    "webpack://app/./main.js"
  ],
  "sourcesContent": [
    "alert('tomato')\r\n"
  ],
  "names": [
    "alert"
  ],
  "sourceRoot": ""
}
```

`解析：`

```text
1. 输出的 'mappings':
"AAAAA,MAAM"

2. 对应的数字为：
[0,0,0,0,0], [6,0,0,6]

3. 对应的含义分别为：
转换后代码的第0列，第0个引入的文件，转换前的第0行，转换前第0列，第0个变量； 对应的就是 alert
转换后代码的第5列，第0个引入的文件，转换前的第0行第0列。没有变量；          对应的就是 ('tomato')
```

##### 5.2.4.2 案例二：

这个案例在案例一的基础上，添加一行注释，对比一下差异。 **重点看一下源码**

`源码：`

```js
// lazy-tomato
alert('tomato')
```

`打包输出的代码：`

```js
alert('tomato')
//# sourceMappingURL=main.js.map
```

`打包输出的 sourcemap 文件：`

```js
{
  "version": 3,
  "file": "main.js",
  "mappings": "AACAA,MAAM",
  "sources": [
    "webpack://app/./main.js"
  ],
  "sourcesContent": [
    "// lazy-tomato\r\nalert('tomato')\r\n"
  ],
  "names": [
    "alert"
  ],
  "sourceRoot": ""
}

```

`解析：`

```text
1. 输出的 'mappings':  （历史的是 "AAAAA,MAAM"）
"AACAA,MAAM"

2. 对应的数字为： （历史的是 [0,0,0,0,0], [6,0,0,6]）
[0,0,1,0,0], [6,0,0,6]

3. 对应的含义分别为：
转换后代码的第0列，第0个引入的文件，*转换前的第1行*，转换前第0列，第0个变量； 对应的就是 alert
转换后代码的第5列，第0个引入的文件，转换前的第0行第0列。没有变量；            对应的就是 ('tomato')
```

可以看到对比案例一，案例二的差异：转换前的代码行数加一了。

##### 5.2.4.3 案例三：

`源码：`

```js
function fn(a, b) {
  return a + b
}
console.log(fn(1, 4))
```

`打包输出的代码：`

```js
console.log(5)
//# sourceMappingURL=main.js.map
```

`打包输出的 Source map 文件：`

```js
{
  "version": 3,
  "file": "main.js",
  "mappings": "AAGAA,QAAQC,IAFCC",
  "sources": [
    "webpack://app/./main.js"
  ],
  "sourcesContent": [
    "function fn(a, b) {\r\n  return a + b\r\n}\r\nconsole.log(fn(1, 4))\r\n"
  ],
  "names": [
    "console",
    "log",
    "a"
  ],
  "sourceRoot": ""
}

```

`解析`

```text
1. 输出的 'mappings':
"AAGAA,QAAQC,IAFCC"

2. 对应的数字为：
[0,0,3,0,0], [8,0,0,8,1], [4,0,-2,1,1]

3. 对应的含义分别为：
转换后代码的第0列，第0个引入的文件，转换前的第3行，转换前第0列，第0个变量；  对应的就是 console
转换后代码的第8列，第0个引入的文件，转换前的第0行，转换前第8列。第1个变量；  对应的就是 log
转换后代码的第4列，第0个引入的文件，转换前的第-2行，转换前第1列。第1个变量；
```

**会发现第三个数据无法对应，我理解它对应的是函数 fn 的执行结果，也就是 `5`；**

> - **数据无法对应，网上猜想的解释**：为了加快编译速度，Source map 对于一些语法是不会计算偏移的，而是直接返回之前的偏移位置。**准确的原因，待确定**

## 六、拓展

### 6.1 Base64 VLQ 编码规则

具体的 `Base64 VLQ ` 编码规则 [点击这里](https://www.cnblogs.com/echoyya/p/16726545.html)

### 6.2 webpack 中 devtool 的多种配置

[官方文档地址点击这里](https://webpack.docschina.org/configuration/devtool/#devtool)

![官方文档的解释.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2976e8d057054629837695ccdd1a7983~tplv-k3u1fbpfcp-watermark.image?)

查看官方文档，可以了解到，devtools 的配置项可以达到 10-20 种左右的情况。其实并不需要记住那么多情况，本质上是一些配置项的排列组合。

配置项如下：

- **source-map**：生成 sourcemap 文件，可以配置 inline，会以 dataURL 的方式内联，可以配置 hidden，只生成 sourcemap，不和生成的文件关联；
- **hidden**：是否会在打包后文件的末尾增加 sourceURL；
- **inline**：不产生独立的 .map 文件，把 source-map 的内容以 dataURI 的方式追加到目标文件末尾；

* **eval**：浏览器 devtool 支持通过 sourceUrl 来把 eval 的内容单独生成文件，还可以进一步通过 sourceMappingUrl 来映射回源码，webpack 利用这个特性来简化了 sourcemap 的处理，可以直接从模块开始映射，不用从 bundle 级别。
* **cheap**：只映射到源代码的某一行，不精确到列，可以提升 sourcemap 生成速度；
* **nosources**：不生成 sourceContent 内容，可以减小 sourcemap 文件的大小；
* **module**： sourcemap 生成时会关联每一步 loader 生成的 sourcemap，可以映射回最初的源码；

> - 具体的组合效果，可自行尝试。
> - webpack 的 devtool 配置项排列顺序，规则：`^(inline-|hidden-|eval-)?(nosources-)?(cheap-(module-)?)?source-map$`。

### 6.3 本地调试线上代码

我以一个 Vue2 项目为例：

1. 在一个普通 Vue2 项目中，添加一行报错；
   > ![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a1efe3311ff743039a4e8670df83986e~tplv-k3u1fbpfcp-watermark.image?)
2. `npm run build` 打包一下我们的工程。
3. 将打包输出的 `dist` 文件夹中的 `.map` 文件，剪切出来存放到本地。然后上传 dist 其他文件到服务器上，用以模拟调试线上代码的情况。
   > - 这里生成 Source map 的配置，可以自己灵活配置。
4. 查看线上代码：

   > - **报错：** ![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c513d2ecb88c46fbb2de5a02c8ac7bb8~tplv-k3u1fbpfcp-watermark.image?)
   > - **对应源码：** ![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a703c4e378594832a08b37f26085d41a~tplv-k3u1fbpfcp-watermark.image?)

5. 手动添加 Source map 文件

   > - 右键 - Add source map;
   > - 通过 file 协议选择本地的 map 文件,先在浏览器地址栏中输入确保可以访问到。
   > - 文件路径示例例：`file:///C:/Users/17607/Desktop/study/chunk-vendors.7723b084.js.map`
   > - _可以直接将 Source map 文件拖拽到谷歌浏览器中，即可得到这个文件路径_

6. 回到控制台发现已经映射到源码了
   > - **已经映射到源码了**![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/502d3bfed4e24ec181df1d666d080015~tplv-k3u1fbpfcp-watermark.image?)

### 6.4 Vue 中如何修改 webpack 的 devtool 配置项

Vue 项目，**如果使用的是 webpack 作为打包工具**，想要自定义 devtool 配置，可用如下方式：

[官方解释点击这里](https://webpack.js.org/configuration/devtool/#development)

```js
// vue.config.js

module.exports = {
  chainWebpack: (config) => {
    config
      .when(process.env.NODE_ENV === 'development, (config) => config.devtool('hidden-source-map'))
  },
}

// 2. 当然还有一个属性 productionSourceMap，可以设置是否生成 Source map。
// productionSourceMap
```

### 6.5 其他打包工具

上述演示生成 Source map，使用的是 webpack 来演示的，了解一下其他打包工具，如何生成 Source map；

#### rollup

`1.新建一个打包配置文件： rollup.config.js`

```
module.exports = {
  input: './main.js',
  output: {
    file: './bundle.js',
    format: 'cjs',
    sourcemap: true,
  },
}
```

`2.安装依赖，开始打包`

```shell
npm i -g  rollup

rollup -c

# 注意一下，注意 NodeJs 版本不要太低。
```

### 6.5 reverse-sourcemap

提到这么一个 npm 依赖，是因为很久之前，番茄我有一次电脑进水了，导致本地 git 仓库丢失了部分 commit 的记录。（_大白话来说，代码丢失了_）

> - 丢失的代码行数还是比较多的，一整天的工作成果；
> - 在无法找回源代码的情况下，我发现最新 Source map 文件还存在。最后我通过这个工具，反编译 Source map 文件，找回了大部分我丢失的代码。

`使用案例：`

```base
# 1. 全局安装此依赖
npm install --global reverse-sourcemap

# 2. 指定编译文件后输出的文件目录，指定编译什么文件；
reverse-sourcemap --output-dir outDir main.js.map
```

`阅读源码：`

看一下 `reverse-sourcemap` 的源码，源码就一个 js 文件，如下：

`reverse-sourcemap/index.js`

```js
'use strict'

const path = require('path')
const sourceMap = require('source-map')

/**
 * @param {string} input Contents of the sourcemap file
 * @param {object} options Object {verbose: boolean}
 *
 * @returns {object} Source contents mapped to file names
 */
module.exports = (input, options) => {
  const consumer = new sourceMap.SourceMapConsumer(input)

  return consumer
    .then((response) => {
      let map = {}
      if (response.hasContentsOfAllSources()) {
        if (options.verbose) {
          console.log('All sources were included in the sourcemap')
        }
        debugger
        console.log(response)
        response.sources.forEach((source) => {
          const contents = response.sourceContentFor(source)
          map[
            path
              .normalize(source)
              .replace(/^(\.\.[/\\])+/, '')
              .replace(/[|\&#,+()?$~%'":*?<>{}]/g, '')
              .replace(' ', '.')
          ] = contents
        })
      } else if (options.verbose) {
        console.log('Not all sources were included in the sourcemap')
      }
      return map
    })
    .catch((e) => {
      console.log(e)
      return {}
    })
}
```

`小结：`
浏览了一下 `reverse-sourcemap` 的源码，使用了 `source-map` 提供的一个对象，来实现的文件转换。

### 6.6 source-map

待补充...

## 七、参考和学习过的文章

1. [阮一峰\_JavaScript Source Map 详解](https://www.ruanyifeng.com/blog/2013/01/javascript_source_map.html)；
2. [zxg*神说要有光*彻底搞懂 Webpack 的 sourcemap 配置原理](https://juejin.cn/post/7136049758837145630)；
3. [SourceMap 解析](https://www.cnblogs.com/SteelArm/p/12865725.html)；
4. [VLQ & Base64 VLQ 编码方式的原理及代码实现](https://www.cnblogs.com/echoyya/p/16726545.html)；

> 感谢 ღ( ´･ᴗ･` )

## end

- 以上就是番茄我对 Source map 的收获总结了。
- 希望自己越来越强，加油！
