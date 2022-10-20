# JS 中的 `&&` `||`

## start

- 最近在阅读 Vue.js 的源码，发现 Vue 的源码中使用了很多`&& ||`相关的代码。
- 在梳理这些代码逻辑的时候，发现 JS 执行结果和我预想的结果不同，所以写一篇文章记录一下。

## 1. 基础使用

`&& ||` 分别是一个*与逻辑*，_或逻辑_

先说说，我之前的使用案例：

```js
var a = 10

var b = '123'

var c = false

if (a && b) {
  console.log('a 和 b 两个都成立,就会执行这里的逻辑')
}
if (c || b) {
  console.log('c 和 b 只要有一个成立,就会执行这里的逻辑')
}
```

- 基础使用：通过 `&&` 和 `||` 连接表达式，依据表达式结果，走不同的 if 语句。

## 2.`&& ||`的返回值

```js
var a = 10

var b = '123'

var c = false

var d

// && 的逻辑演示
var out1 = a && b
var out2 = c && a

// || 的逻辑演示
var out3 = c || b
var out4 = c || d

console.log(out1) // 123
console.log(out2) // false
console.log(out3) // 123
console.log(out4) // undefined
```

- ~~以前以为 `a && b` 返回值是布尔值~~

- 如何判断`a && b`的返回值？

  1. `&&`

     > 与逻辑，表示两边的逻辑都为真，才会返回真，所以两个都为真，返回最后一个真；第一个就为假，直接返回假；

  2. `||`

     > 或逻辑，表示两边的逻辑都为假，才会返回假，所以两个都为假，返回最后一个假；第一个就为真，直接返回真；

简单来说，其实就是从左到右执行，左侧满足条件，再向右依次执行。

### 思考

上述的代码示例，是对变量进行`与，或`的逻辑处理。

可以**直接使用函数的返回值用作对比**，达到又能做判断，又能执行对应的函数。

例如 Vue.js 中的部分源码：

```js
let childOb = !shallow && observe(val)

return (
  a.length === b.length &&
  a.every((e, i) => {
    return looseEqual(e, b[i])
  })
)
```

当然，上述的实例只是做一个展示，具体逻辑不做考究。

学习到这里，我的某些代码是不是就可以精简一下？

`示例一：给函数设置默认的返回值`

```js
function foo() {
  var str

  /* ...任意代码 */

  return str || 'lazy_tomato'
  // 如果str存在，就返回str；
  // 如果str不存在，返回'lazy_tomato'；
}
```

`示例二：省略 if`

```js
var arr = [1, 2]

var newArr =
  Array.isArray(arr) && arr.length > 0 && arr.some((i) => i === 'tomato')

console.log(newArr)

// 判断变量 arr 中是否包含`tomato`
```

## 运算符优先级

阅读上述代码的时候，其实有一个隐式的逻辑，那就是运算符的优先级。

[MDN 对运算符的优先级说明](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Operator_Precedence)

#### 常见的运算符优先级

1. 小括号`()`
   有括号先算括号里面的；

2. 一元运算符
   加加`++`； 减减`--`； 非`!`

3. 算数运算符
   加`+`;减`-`;乘`*`;除`/`;取于`%`；这里是先乘`*`除`/`取于（`%`）后加`+`减`-`

4. 关系运算符
   大于`>`;大于等于`>=`;小于`<`;小于等于`<=`

5. 相等运算符
   等于`==`；不等于`!=`;全等于`===`;不全等于`!=`

6. 逻辑运算符
   先且`&&`后或`||`

7. 条件表达式`?: `

8. 赋值运算符`=`

9. 逗号运算符`,`

## 自测题目

### 题目一

```js
console.log(true || (false && console.log(13)))
// true
```

这个题目检查的正是我们这篇文章讲述的主要逻辑，从左向右执行，或逻辑，一个为真即返回。

> 如何验证`||` 右侧的逻辑都未执行呢？

```js
console.log(true || (false && console.log(13)))
// true

console.log(console.log('lazy') || (console.log('tomato') && false))
// lazy
// tomato
// undefined
```

### 题目二

```js
let value = '3'
let index = 3
let flag = value == index ? 1 : 2
console.log(flag) // 1
```

首先，了解一下优先级。_可以对照上面的常用运算符优先级_

**相等运算符 》 条件表达式 》 赋值运算符**

①
`value == index`
这里是`'3'==3`，返回 true

②
`true ? 1 : 2`
返回 1

③
`let flag = 1`
所以 flag 为 1

## end

学习到目前为止，基础的代码都能梳理出执行结果了。后续若有比较有趣的代码，再做补充。
