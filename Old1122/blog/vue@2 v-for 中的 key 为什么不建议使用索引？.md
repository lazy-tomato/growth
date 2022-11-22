# vue@2 v-for 中的 key 为什么不建议使用索引？

## start

- 前几天阅读过 Vue@2 中虚拟 DOM 的 diff 相关代码。
- 这几天见到 `v-for`中使用索引当做`key`，出现 input 内容错乱的情况 _(后续会做详细说明)_。
- 今天结合源码，解答解答这个问题

## 案例说明

```html
<template>
  <div id="app">
    <h2 @click="add">点我头部插入内容</h2>
    <div v-for="(item, index) in list" :key="index">
       {{ item.name }}  
      <input type="text" />
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        list: [
          { name: '张三', id: '1' },
          { name: '李四', id: '2' },
          { name: '王五', id: '3' },
        ],
      }
    },
    methods: {
      add() {
        this.list.unshift({ name: '赵六', id: '4' })
      },
    },
  }
</script>
```

`运行效果截图`

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a0874ddb5ece4d709f49eb0302d55912~tplv-k3u1fbpfcp-watermark.image?)

`代码说明`

上面是一个 `v-for` 的示例, 遍历数组`list`，使用了 `index`_(索引)_ 当做 `key` 值。

配置了一个按钮，点击按钮的时候，调用 `add` 事件，向 `list` 数组**头部**插入一条数据。

`问题演示`

![20221018144042.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/00859239b9f54a4a9993bba69cbde5ec~tplv-k3u1fbpfcp-watermark.image?)

为什么输入框的内容会同步上移，这里面涉及到了那些知识？

## 问题解析

点击按钮后，主要会有一个流程：

`简单描述`

数据发生改变，会生成新的虚拟 DOM，新的 虚拟 DOM 和 旧的 虚拟 DOM 进行对比，根据差异渲染真实的 DOM。

`详细过程`

1. 数组`list` unshift 一个对象，会调用 Dep 的 notify 方法，然后会触发 Watcher 的 get 方法进行更新;
2. 然后以组件为单位调用`Vue._render()`生成最新的`vnode` ，再通过`Vue._update()`触发 `patch()`;
   > 新的 vnode 由`_render`生成,旧的 vnode 是上次渲染的 vnode，存放在`vm._vnode`
3. patch 中会**对比**新旧虚拟节点，生成最终的真实 DOM

要彻底弄清楚问题的原因，就是需要了解对比新旧虚拟节点主干逻辑(又可以称为 diff 算法)。

#### diff 算法简单介绍

diff 算法是平级比较，不考虑跨级的情况，采用深度递归+双指针的方式进行比较

- 先比较是否是相同节点
- 如果是相同节点比较属性(key、tag、input->type)，并复用老节点
- 然后比较子节点，以先对比两边，再交叉对比，再乱序对比的方式进行比较(旧前新前、旧后新后、旧前新后、旧后新前、乱序)

> 注意：如果子节点中还存在子节点，会深度优先，递归对比。

#### 如何判断是相同节点

```js
function sameVnode(a, b) {
  return (
    a.key === b.key &&
    a.asyncFactory === b.asyncFactory &&
    ((a.tag === b.tag &&
      a.isComment === b.isComment &&
      isDef(a.data) === isDef(b.data) &&
      sameInputType(a, b)) ||
      (isTrue(a.isAsyncPlaceholder) && isUndef(b.asyncFactory.error)))
  )
}

// 两个输入框类型的虚拟DOM. 1.类型相同；2.属于文本类型的input
function sameInputType(a, b) {
  if (a.tag !== 'input') return true
  var i
  var typeA = isDef((i = a.data)) && isDef((i = i.attrs)) && i.type
  var typeB = isDef((i = b.data)) && isDef((i = i.attrs)) && i.type
  return typeA === typeB || (isTextInputType(typeA) && isTextInputType(typeB))
}

function isDef(v) {
  return v !== undefined && v !== null
}

function isTrue(v) {
  return v === true
}

// 判断类型是不是下方字符串包含的种类，是返回true。
var isTextInputType = makeMap('text,number,password,search,email,tel,url')

function makeMap(str, expectsLowerCase) {
  var map = Object.create(null)
  var list = str.split(',')
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? function (val) {
        return map[val.toLowerCase()]
      }
    : function (val) {
        return map[val]
      }
}
```

上述代码就是判断是否是相同节点的代码。

核心逻辑`sameVnode`,主要判断了这么几个属性是否相同

1. key _标识_
2. asyncFactory _异步组件_
3. tag _标签名_
4. isComment _是否是注释_
5. data _属性数据_
6. sameInputType _相似的输入框类型_

#### 案例逻辑梳理

为了方便理解，就案例中的新旧虚拟 DOM。我就模拟简化出来，如下述代码。

**部分属性做了省略**

```js
// 旧的虚拟DOM
var oldVnode = {
  tag: 'div',
  children: [
    {
      tag: 'h2',
      children: [{ text: '点我头部插入内容' }],
    },
    {
      tag: 'div',
      children: [{ text: '张三' }, { tag: 'input' }],
      key: 0,
    },
    {
      tag: 'div',
      children: [{ text: '李四' }, { tag: 'input' }],
      key: 1,
    },
    {
      tag: 'div',
      children: [{ text: '王五' }, { tag: 'input' }],
      key: 2,
    },
  ],
}

// 新的虚拟DOM
var newVnode = {
  tag: 'div',
  children: [
    {
      tag: 'h2',
      children: [{ text: '点我头部插入内容' }],
    },
    {
      tag: 'div',
      children: [{ text: '赵六' }, { tag: 'input' }],
      key: 0,
    },
    {
      tag: 'div',
      children: [{ text: '张三' }, { tag: 'input' }],
      key: 1,
    },
    {
      tag: 'div',
      children: [{ text: '李四' }, { tag: 'input' }],
      key: 2,
    },
    {
      tag: 'div',
      children: [{ text: '王五' }, { tag: 'input' }],
      key: 3,
    },
  ],
}
```

`对比逻辑梳理`

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b1cb93763fe14bf3a9e30cc2222b8d29~tplv-k3u1fbpfcp-watermark.image?)

结合上图所描述的虚拟 DOM 对比步骤，可以了解到动图中的问题来源。**建议多读几遍**

因为 `sameVnode` 主要是判断 `key，tag，输入框类型` 等属性是否相同。当我们向数组头部插入一条数据的时候，新的虚拟 DOM 的 key 都会被更新。导致后续使用 key 匹配的时候，匹配到的节点是错乱的。

`对比子节点的逻辑`

- 文本内容会更新

- `input`输入框
  > 虚拟节点 vnode 并没有存储 真实的输入框中所有的属性，虚拟节点主要存储了`key，tag，输入框类型`。在对比子元素的的输入框的时候，虽然输入框的输入值是不同的，但是它们满足 `sameVnode` ，所以可以直接复用旧的真实 DOM。
  >
  > 直接复用的意思就是（不修改原本的真实 DOM），**所以输入框的内容会保留**。

逻辑依次类推。

对比到在新的虚拟 DOM 中 **key 为 3** 的节点，因为在旧的虚拟 DOM 中没有匹配的 key，所以直接创建新的真实 DOM。

`小结`

学习到这里，就知道案例中问题的原因。

> 向数组头部添加数据，会影响渲染的节点的 key。在新旧节点对比的过程中，是使用的 key 去判断是否是相同节点，再加上 input 框的输入的内容，并不会在新旧对比中体现，两者结合就导致历史的输入框会上移。

`问题的解决`

方案一：

使用正确唯一的标识当做 key。

> 例如：使用案例中的`id` 当做 key _（而不是 index）_；

方案二：

简易的组件，方便起见，可以考虑使用索引当做 key。

## end

- 了解到 key 对节点对比的重要性后，相信我以后在编写 v-for 的时候，会更加合理的去使用 key。
