# javascript 字符串中与正则有关的方法

## start

- 最近在看 vue2 模板编译的源码，看得我内心极度煎熬（_正则看不懂！！_ ）。

  ![1665498555260.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a9e2a510c6914a8eb588b2ac1977c1e7~tplv-k3u1fbpfcp-zoom-1.image)

- 首先我最好奇的就是 **字符串中与正则有关的方法**。

- 生疏到熟练总是有这么一个过程的，现在就开始学习起来。加油！给自己打气！！！

> **注意！！ 本篇文章讲述的是字符串的相关方法**

## 1. search

### 1.1 使用案例

```js
var str = 'nihaohhh'

console.log(str.search('h')) // 2
console.log(str.search(/a/)) // 3
console.log(str.search(/ab/)) // -1
console.log(str.search(/h/g)) // 2
```

### 1.2 作用

**`search()`** 方法执行正则表达式和 String 对象之间的一个搜索匹配。

### 1.3 参数

一个正则表达式（regular expression）对象。如果传入一个非正则表达式对象 regexp，则会使用 new RegExp(regexp) 隐式地将其转换为正则表达式对象。

### 1.4 返回值

如果匹配成功，则 search() 返回正则表达式在字符串中首次匹配项的索引;否则，返回 -1。

### 1.5 思考

1.  和 indexof() 方法很相似，不过 search 中传入的是正则表达式，匹配的逻辑会更加灵活。
2.  **注意**，正则表达式就算加了 `g` 修饰符，search 方法也只会返回首次匹配项的索引。（不会返回多个）

## 2. split

### 2.1 使用案例

```js
var str = 'n_i ha+ohh-h'

console.log(str.split()) // [ 'n_i ha+ohh-h' ]
console.log(str.split(' ')) // [ 'n_i', 'ha+ohh-h' ]
console.log(str.split('h')) // [ 'n_i ', 'a+o', '', '-', '' ]
console.log(str.split('h', 2)) // [ 'n_i ', 'a+o']
console.log(str.split(/[_+-]/)) // [ 'n', 'i ha', 'ohh', 'h' ]
```

### 2.2 作用

split() 方法使用指定的分隔符字符串将一个 String 对象分割成子字符串数组，以一个指定的分割字串来决定每个拆分的位置。

### 2.3 参数

`str.split([separator[, limit]])`

separator 指定表示每个拆分应发生的点的字符串。separator 可以是一个字符串或正则表达式。如果纯文本分隔符包含多个字符，则必须找到整个字符串来表示分割点。如果在 str 中省略或不出现分隔符，则返回的数组包含一个由整个字符串组成的元素。如果分隔符为空字符串，则将 str 原字符串中每个字符的数组形式返回。

limit 一个整数，限定返回的分割片段数量。当提供此参数时，split 方法会在指定分隔符的每次出现时分割该字符串，但在限制条目已放入数组时停止。如果在达到指定限制之前达到字符串的末尾，它可能仍然包含少于限制的条目。新数组中不返回剩下的文本。

### 2.4 返回值

返回源字符串以分隔符出现位置分隔而成的一个 Array

### 2.5 思考

1. `split`字符串转成数组非常好用的方法。

2. 第一个参数：分割字符串的分隔符，可以为字符串，也可以为正则。

3. 第二个参数：分割的条目

4. 例如 `'lazy_tomato'.split('_')`

   > 简单来说，其实就是希望以`_`开始分割字符串，分割的项组成一个数组。

5. **简单的场景使用字符串没有问题，但是有些复杂的场景正则表达式更加灵活**，例如`'n_i ha+ohh-h'.split(/[_+-]/)`

   > 简单来说，只要符合正则表达式的逻辑，就把它当做分隔符。

## 3. match

### 3.1 使用案例

```js
var str = 'AABBcCDdEEFF'

/* 1. 什么都不传 => 返回空字符串数组 */
console.log(str.match()) // [ '', index: 0, input: 'AABBcCDdEEFF', groups: undefined ]

/* 2. 传入字符串 -> 会被隐式 `new RegExp()`  */
console.log(str.match('B')) // [ 'B', index: 2, input: 'AABBcCDdEEFF', groups: undefined ]

/* 3. 不带 `g` 修饰符的正则 */
console.log(str.match(/B/)) // [ 'B', index: 2, input: 'AABBcCDdEEFF', groups: undefined ]

/* 4. 带 `g` 修饰符的正则*/
console.log(str.match(/B/g)) // [ 'B', 'B' ]

/* 5. 带 `g` 修饰符的正则，没有匹配上 => null */
console.log(str.match(/tomato/g)) // null

/* 
6. 返回值
- 如果使用 g 标志，则将返回与完整正则表达式匹配的所有结果，但不会返回捕获组。
- 如果未使用 g 标志，则仅返回第一个完整匹配及其相关的捕获组（`Array`）。在这种情况下，返回的项目将具有如下所述的其他属性。

[ 'B', index: 2, input: 'AABBcCDdEEFF', groups: undefined ]
数组中会存储：匹配到的值；
index: 匹配的结果的开始位置；
input: 搜索的字符串；
groups: 一个捕获组数组 或 undefined（如果没有定义命名捕获组）
*/
```

### 3.2 作用

**`match()`** 方法检索返回一个字符串匹配正则表达式的结果。

### 3.3 参数

`str.match(regexp)`

- regexp 一个正则表达式对象。如果传入一个非正则表达式对象，则会隐式地使用 new RegExp(obj) 将其转换为一个 RegExp 。

- 如果你没有给出任何参数并直接使用 match() 方法，你将会得到一 个包含空字符串的 Array ：[""] 。

### 3.4 返回值

- 如果使用 `g` 标志，则将返回与完整正则表达式匹配的所有结果，但不会返回捕获组。
- 如果未使用 `g` 标志，则仅返回第一个完整匹配及其相关的捕获组（`Array`）。

> 未使用 g 标志返回的项目将具有如下所述的其他属性：
>
> 匹配到的第一个值；
>
> index: 匹配的结果的开始位置；
>
> input: 搜索的字符串；
>
> groups: 一个捕获组数组 或 undefined（如果没有定义命名捕获组）

### 3.5 思考

1. `match`这个方法**超级常用**。

2. `match` 和 `search` 传入的参数有些类似，都是一个正则表达式对象。

   > - 需要注意的是，不传参数，则返回一个空字符串的数组。
   > - 匹配不上返回 `null`

3. 注意区分，匹配的正则表达式带 `g` 和不带 `g` 的情况。

   > - `g` 表示全局匹配
   > - 使用 `g` 标志，返回与完整正则表达式匹配的所有结果；
   > - 未使用 `g` 标志，返回第一个完整匹配及其相关的捕获组；

4. 还有这种情况：

   > ```js
   > 'lazy666_tomato777'.match(/\d/) // [ '6', index: 4, input: 'lazy666_tomato777', groups: undefined ]
   > 'lazy666_tomato777'.match(/(\d)/) // [ '6', '6', index: 4, input: 'lazy666_tomato777', groups: undefined ]
   >
   > // 如果添加了 `()`, 数组中会存储所有符合条件的项
   > // `()` 表示捕获的意思。
   > ```

## 4. replace

### 4.1 使用案例

```js
var str = 'lazy_tomato'

/* 1. 字符串替换 */
console.log(str.replace('a', 'A')) // lAzy_tomato

/* 2. 不会修改原本的字符串 */
console.log(str) // lazy_tomato

/* 3. 字符串只能替换一次，正则可以替换多次 */
console.log(str.replace(/a/g, 'A')) // lAzy_tomAto

/* 4. replace第二个参数可以传入函数 */

console.log(
  'aa1bb2cc3dd4ee'.replace(/(\d)+(\w)/g, function () {
    console.log(...arguments)
    /* 
    1b 1 b 2 aa1bb2cc3dd4ee
    2c 2 c 5 aa1bb2cc3dd4ee
    3d 3 d 8 aa1bb2cc3dd4ee
    4e 4 e 11 aa1bb2cc3dd4ee
    */

    return '--' // 函数的返回值就是要替换成的内容,不写 return,则返回 undefined
  })
)
// aa--b--c--d--e

/* 
replace第二参数如果为函数，函数的参数说明：

1. 第一个参数：匹配到的项
2. 中间的参数：捕获到的内容
3. 倒数第二个参数：匹配项的索引
4. 倒数第一个参数：原本的字符串
*/

```

### 4.2 作用

replace() 方法用于在字符串中用一些字符替换另一些字符，或替换一个与正则表达式匹配的子串。

### 4.3 参数

```
str.replace(regexp|substr, newSubStr|function)
```



第一个参数：匹配的正则或者字符串；

第二个参数：替换的字符串或者函数；





### 4.4 返回值

一个部分或全部匹配由替代模式所取代的新的字符串。



### 4.5 思考

1. `replace` 和 `match` 类似，用的也非常多。

2. 需要注意的是，replace第一个参数可以是正则，或者字符串

   > *如果是正则，加`g`修饰符可以替换所有符合规则的字段*。

3. replace第二个参数可以是字符串，也可以是函数。函数的返回值就是要替换成的内容。

   > replace第二参数如果为函数，函数的参数说明：
   >
   > 1. 第一个参数：匹配到的项
   > 2. 中间的参数：捕获到的内容
   > 3. 倒数第二个参数：匹配项的索引
   > 4. 倒数第一个参数：原本的字符串











## 题目

### 1. 使用 match匹配 html中文档类型声明

```js

var html = '<!DOCTYPE html> 213'

var output = html.match(/^<!DOCTYPE [^>]+>/i)

console.log(output)
/* 

[
  '<!DOCTYPE html>',
  index: 0,
  input: '<!DOCTYPE html> 213',
  groups: undefined
]

*/

/* 

1. match ，匹配规则没有使用`g`, 第一个参数:第一个完整匹配,所以返回 `'<!DOCTYPE html>'`

2. 上述逻辑很简单。匹配html的开头标识；

3.  /^<!DOCTYPE [^>]+>/

`i` : 忽略大小写匹配
`//`: 左右两个右斜杠，表示正则；
`^` : 这里的`^<!DOCTYPE ` 表示以`<!DOCTYPE `卡开头头
`[^>]` : 表示匹配除了`>`的字符  （在中括号中的 ^ , 表示排除这些字符串）
`+>` : 表示 重复一次或更多次（至少有一次）`>`
*/

```



### 2. replace方法巧妙替换

```js
console.log('aa_bb+cc-dd$dd'.replace(/[_+\-$]/g, '--'))

这里可以替换所有符合条件的情况，

`[]` 表示：包含
`\-` 表示： 反斜杠是转义的意识，其实就是代表`-`
```





## end

+ 正则玩好了，其实很多地方都可以用到，多用多复习，一定能掌握的，加油！！
