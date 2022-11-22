对原数组有影响的方法
数组去重
冒泡排序，选择排序，插入排序
内存结构
堆栈区别
全局执行环境
函数执行环境
引用计数
循环引用
new 关键字作用
原型链
闭包
继承
call 和 apply 和 bind 区别
节流，防抖
深拷贝，浅拷贝
事件委派
为什么使用事件委派
什么情况下会使用到事件委派

1. 对原数组有影响的方法
   vue 中的那其中
   pop
   push
   shift
   unshift
   reverse
   sort
   splice

2. 数组去重
   利用 ES6 的 set
   双层循环，外层循环元素，内层循环时比较值 （可以生成新数组，可以原数组上修改）
   利用对象的属性不能相同的特点进行去重
   数组递归去重（先排序，然后从最后开始比较，遇到相同，则删除）

3. 冒泡排序，选择排序，插入排序
   冒泡

```js
function bubbleSort(arr) {
  var len = arr.length
  for (var i = 0; i < len; i++) {
    for (var j = 0; j < len - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        //相邻元素两两对比
        var temp = arr[j + 1] //元素交换
        arr[j + 1] = arr[j]
        arr[j] = temp
      }
    }
  }
  return arr
}
var arr = [3, 44, 38, 5, 47, 15, 36, 26, 27, 2, 46, 4, 19, 50, 48]
console.log(bubbleSort(arr)) //[2, 3, 4, 5, 15, 19, 26, 27, 36, 38, 44, 46, 47, 48, 50]

function bubbleSort2(arr) {
  console.time('改进后冒泡排序耗时2')
  var i = arr.length - 1 //初始时,最后位置保持不变
  while (i > 0) {
    var pos = 0 //每趟开始时,无记录交换
    for (var j = 0; j < i; j++)
      if (arr[j] > arr[j + 1]) {
        pos = j //记录交换的位置
        var tmp = arr[j]
        arr[j] = arr[j + 1]
        arr[j + 1] = tmp
      }
    i = pos //为下一趟排序作准备
  }
  console.timeEnd('改进后冒泡排序耗时2')
  return arr
}
var arr = [3, 44, 38, 5, 47, 15, 36, 26, 27, 2, 46, 4, 19, 50, 48]
console.log(bubbleSort2(arr)) //[2, 3, 4, 5, 15, 19, 26, 27, 36, 38, 44, 46, 47, 48, 50]
```

选择

```js
function selectionSort(arr) {
  var len = arr.length
  var minIndex, temp
  console.time('选择排序耗时')
  for (var i = 0; i < len - 1; i++) {
    minIndex = i
    for (var j = i + 1; j < len; j++) {
      if (arr[j] < arr[minIndex]) {
        //寻找最小的数
        minIndex = j //将最小数的索引保存
      }
    }
    temp = arr[i]
    arr[i] = arr[minIndex]
    arr[minIndex] = temp
  }
  console.timeEnd('选择排序耗时')
  return arr
}
var arr = [3, 44, 38, 5, 47, 15, 36, 26, 27, 2, 46, 4, 19, 50, 48]
console.log(selectionSort(arr)) //[2, 3, 4, 5, 15, 19, 26, 27, 36, 38, 44, 46, 47, 48, 50]
```

插入

```js

```

4. 堆栈区别
   JS 变量都存放在内存中，而内存给变量开辟了两块区域，分别为栈区域和堆区域
   栈像个容器，容量小速度快
   堆像个房间，容量较大

   基本类型是存在栈内存中的，引用类型是存在堆内存中的，但是引用类型的引用还是存在栈内存中的。

5. 全局执行环境
   全局执行上下文

6. 函数执行环境
   函数执行上下文

7. 引用计数
   循环引用

8. new 关键字作用
   原型链
   闭包
   继承
   call 和 apply 和 bind 区别
   节流，防抖
   深拷贝，浅拷贝

事件委派
为什么使用事件委派
什么情况下会使用到事件委派
https://blog.csdn.net/Chen_start02/article/details/80176388
