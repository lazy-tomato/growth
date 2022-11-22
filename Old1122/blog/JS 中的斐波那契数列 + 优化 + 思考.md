# JS 中的斐波那契数列 + 优化 + 思考

## start

- 番茄近一段时间，看到好多次`斐波那契数列`相关的问题，挺有收获的，所以写一个博客记录一下。

## 斐波那契数列

### 概念：

斐波那契数列指的是这样一个数列：_1，1，2，3，5，8，13，21，34，55，89..._

这个数列从第 3 项开始，每一项都等于前两项之和。

### 问题：

希望可以快速知道斐波那契数列第 n 项的值是多少。

### 解答：

思路很简单，百度百科提供的公式：

```
F(0)=0，F(1)=1, F(n)=F(n - 1)+F(n - 2)（n ≥ 2，n ∈ N*）
```

落实到具体的代码

```js
function fn(n) {
  if (n === 0 || n === 1) {
    return n
  }
  return fn(n - 1) + fn(n - 2)
}
```

> 结合公式，落实到具体的代码就是上述的逻辑。**主要是递归的思路，递归调用`fn`**

## 优化

假如我输入的是`fn(5)`。

```text
// 整体的求值逻辑：从左向右直到n为0或者1。
// >>>>>>>
fn(5)
      fn(4)
            fn(3)
                  fn(2)
                        fn(1)
                        fn(0)
                  fn(1)
            fn(2)

      fn(3)
            fn(2)
                  fn(1)
                  fn(0)
            fn(1)
```

可以发现，就以 `fn(5)` 为例，`fn(3)，fn(2)`重复计算了很多次。

### 1. 闭包 + 数组缓存

```js
// 闭包 + 数组缓存的形式缓存我们的 fn(X)
let fn = (function () {
  let temp = [0, 1]
  return function (n) {
    let result = temp[n]
    if (typeof result != 'number') {
      result = fn(n - 1) + fn(n - 2)
      temp[n] = result
    }
    return result
  }
})()
```

这种方式对于我来说，是最容易想到的，将已经计算过的 `fn`缓存在数组中。

### 2. 动态规划

```js
function fn(n) {
  let current = 0
  let next = 1
  let temp
  for (let i = 0; i < n; i++) {
    temp = current
    current = next
    next += temp
  }
  return current
}

// 动态规划：从底部开始解决问题，将所有小问题解决掉，然后合并成一个整体解决方案，从而解决掉整个大问题；
// 递归：从顶部开始将问题分解，通过解决掉所有分解的小问题来解决整个问题；
```

简单来说，从最小的颗粒度开始解决问题，直到顶部。

上述代码理解起来很简单，从 0 开始，变量`next`会累加之前的总和

> 看到有人说道这么一句话：递归能解决的问题，循环大部分也能解决。

### 3. 尾递归

```js
function fn(n, start = 1, total = 1) {
  if (n < 2) {
    return total
  }
  return fn(n - 1, total, total + start)
}
```

> - 传统的递归，会创建很多的函数调用栈，如果遇到复杂的递归，很容易造成栈溢出。
>
> - 而尾递归，只存在一个调用记录，所以不会发生"栈溢出"错误

**尾递归**，即在函数尾位置调用自身（或是一个尾调用本身的其他函数等等）

> 其他注意事项：
>
> 1. JS 中是 ES6 才会开启尾递归的优化。
> 2. 严格模式（及 `'use strict'`）。
> 3. 注意尾部调用函数的时候，不要引用外部变量。

个人理解：简单来说，就是一个函数调用栈的优化，如果是函数尾部调用函数，编译器会帮我们优化掉对应的`函数调用栈`，防止栈溢出。

其次注意：1. 尾部调用的函数不要引用外部变量（会形成闭包）；2.尾部除了调用函数不要做其他操作。

## 思维发散

着重提一下，**缓存数据来提升性能**的这种方式。

让我不禁想起来最近再看 Vue2 源码的时候，看到的一个工具函数 `capitalize`。

`vue@2 \src\shared\util.js`

```js
/**
 * Create a cached version of a pure function.
 */
// 创建纯函数的缓存版本。
export function cached(fn) {
  //一个空对象
  const cache = Object.create(null)
  return function cachedFn(str) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}

/**
 * Capitalize a string.
 * 首字母大写
 */
export const capitalize = cached((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

console.log(capitalize('tomato')) // Tomato
```

`capitalize`函数的作用很简单，首字母大写;

但是我自己印象非常深刻，因为我前几天还自己写了一个首字母转换的函数，看到 Vue2 的写法，觉得很棒，这也是一个思路，缓存的思路。

**遇到重复计算的地方，可以考虑缓存的方式优化**

## end

- 漂亮的代码真的很棒，加油！！
