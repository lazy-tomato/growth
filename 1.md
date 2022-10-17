Vue@2 中 render 的第一个形参： createElement*(h 函数)*。

## start

- 前面学习了 `render`选项，学习了 `$mount`。
- 我对 `render` 的第一个参数 `createElement`，非常好奇，今天来学习一下它的源码。

## 前置逻辑

执行到 `render` 之前的逻辑，我这里就简单做一下说明。

1. `$mount`
2. `mountComponent`
3. `vm._update(vm._render());`

`_render`

```js
// \src\core\instance\render.js

import { createElement } from '../vdom/create-element'
vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

const { render, _parentVnode } = vm.$options

// _render本身逻辑蛮多的，主干逻辑精简下来，就是下面这行代码。
vnode = render.call(vm._renderProxy, vm.$createElement)
```

在 `_render` 函数中,调用了 `render`，而且传入的第一个参数为`vm.$createElement`。

经过一系列包装，`vm.$createElement` 本质是 `createElement`。

> `render` 函数的形参名是可以随意定义的。
>
> 例如：`createElement` ， `h`。

## createElement

看一下 `createElement` 的源码。

```js
const ALWAYS_NORMALIZE = 2

// createElement 主要返回 `_createElement` 函数。
// 功能类似的函数，开头带下划线，在Vue.js中这种写法也很多，例如 `_render`和 `render` 。
export function createElement(
  context: Component, // 当前组件的 Vue.js 实例。
  tag: any, // 元素的标签
  data: any, // 元素的属性
  children: any, // 当前节点的子节点列表
  normalizationType: any, // 表示子节点规范的类型，类型不同规范的方法也就不一样，它主要是参考 render 函数是编译生成的还是用户手写的。
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  return _createElement(context, tag, data, children, normalizationType)
}

// 判断是否是原始值
export function isPrimitive(value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

// 是否是 true
export function isTrue(v) {
  return v === true
}
```

- `createElement` 主要作用：返回了 `_createElement` 函数。

> - 这里会对传入的 `data`进行处理，如果`data`是数组或者静态文本，会赋值给`children`。
>
> - 说一些题外话 这里的`_createElement` 和 `createElement`,加上之前的`_render`和 `render`, 在 Vue.js 中，`$`开头表示 Vue 暴露给外部的 API;`_`开头表示 Vue.js 内部的方法,不对外暴露。

## `_createElement`

看一下 `_createElement` 的源码。

```js
// 真正创建元素的函数
export function _createElement(
  context: Component, // 当前组件的 Vue.js实例
  tag?: string | Class<Component> | Function | Object, // 节点名称 类似于 p ul li 和 div 等
  data?: VNodeData, // 包含了一些节点上的数据 ； 例如 attrs,class,style;
  children?: any, // 当前节点的子节点列表； [vnode , vnode]
  normalizationType?: number // 标准化的类型，主要是参考 render是编译生成还是用户手写。
): VNode | Array<VNode> {
  // 1. 排除响应式的数据。
  if (isDef(data) && isDef(data.__ob__)) {
    process.env.NODE_ENV !== 'production' &&
      warn(
        `Avoid using observed data object as vnode data: ${JSON.stringify(
          // 避免使用被观察数据对象作为vnode的数据
          data
        )}\n` + 'Always create fresh vnode data objects in each render!',
        // 总是在每次渲染中创建新的vnode数据对象!
        context
      )
    return createEmptyVNode()
  }
  // object syntax in v-bind
  // 2. `:is` 语法
  if (isDef(data) && isDef(data.is)) {
    tag = data.is
  }

  // 3. 没有tag,返回空的VNode
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // warn against non-primitive key
  // 虚拟节点的 key ，不能为对象。
  if (
    process.env.NODE_ENV !== 'production' &&
    isDef(data) &&
    isDef(data.key) &&
    !isPrimitive(data.key)
  ) {
    if (!__WEEX__ || !('@binding' in data.key)) {
      warn(
        'Avoid using non-primitive value as key, ' +
          'use string/number value instead.',
        context
      )
    }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) && typeof children[0] === 'function') {
    data = data || {}
    data.scopedSlots = { default: children[0] }
    children.length = 0
  }

  // 4. 格式化 children   （两种格式化方式）
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }
  let vnode, ns

  // 5. 如果 tag 是字符串
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)

    //  6. 如果是 html标签
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      if (
        process.env.NODE_ENV !== 'production' &&
        isDef(data) &&
        isDef(data.nativeOn) &&
        data.tag !== 'component'
      ) {
        warn(
          `The .native modifier for v-on is only valid on components but it was used on <${tag}>.`,
          context
        )
      }

      // 创建元素节点
      vnode = new VNode(
        config.parsePlatformTagName(tag),
        data,
        children,
        undefined,
        undefined,
        context
      )
    } else if (
      (!data || !data.pre) &&
      isDef((Ctor = resolveAsset(context.$options, 'components', tag)))
    ) {
      // component
      // 7. 如果是已注册的组件
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      // 8. 其他情况
      vnode = new VNode(tag, data, children, undefined, undefined, context)
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children)
  }

  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns)
    if (isDef(data)) registerDeepBindings(data)
    return vnode
  } else {
    return createEmptyVNode()
  }
}
```

`_createElement` 中主干逻辑分为两点

1. 处理 `children` 子节点；
2. 创建 `VNode`；

### 1. 子节点的处理

```js
// 格式化 children   （两种格式化方式）
if (normalizationType === ALWAYS_NORMALIZE) {
  children = normalizeChildren(children)
} else if (normalizationType === SIMPLE_NORMALIZE) {
  children = simpleNormalizeChildren(children)
}
```

#### simpleNormalizeChildren

```js
// 简单的标准子节点
export function simpleNormalizeChildren(children: any) {
  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}
```

- `simpleNormalizeChildren` 方法调用场景是 render 函数是编译生成的。
- 理论上编译生成的 children 都已经是 VNode 类型的。
- 但有一个例外，就是 `functional component` 函数式组件返回的是一个数组而不是一个根节点，所以会通过 Array.prototype.concat 方法把整个 children 数组打平，让它的深度只有一层。

> - 纯看函数有些枯燥， 可以理解为 `[1, 2, [3], [4, [5, 6]]]` => `[ 1, 2, 3, 4, [ 5, 6 ] ]`
>
> - 也没有很高深的逻辑，其实就是扁平化一层数组。
> - 我自己阅读到这里，一开始有点懵逼，一个`concat`就可以实现数组扁平化？
>   数组中只要有一项是数组，就借助 apply 扁平化一层数组，然后借助 concat 拼接每一项。
>   它这里的 apply 用的很妙，apply 本身就会对第二个参数做一次展开。

#### normalizeChildren

```js
// 标准的子节点
export function normalizeChildren(children: any): ?Array<VNode> {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
    ? normalizeArrayChildren(children)
    : undefined
}

/* 
简化一下

    if (isPrimitive(children)) {
      // 1. 如果 children 是原始值，当做文本节点处理。
      return [createTextVNode(children)]
    } else {
      // 2. 数组的情况，调用 normalizeArrayChildren
      if (Array.isArray(children)) {
        return normalizeArrayChildren(children)
      }
    }

*/
```

`normalizeChildren` 方法的调用场景有 2 种:

- 一个场景是 render 函数是用户手写的，当 children 只有一个节点的时候，Vue.js 从接口层面允许用户把 children 写成基础类型用来创建单个简单的文本节点，这种情况会调用 createTextVNode 创建一个文本节点的 VNode;
- 另一个场景是当编译 slot、v-for 的时候会产生嵌套数组的情况，会调用 normalizeArrayChildren 方法，接下来看一下它的实现：

`normalizeArrayChildren` 的逻辑这里就简述一下:

1. 遍历 `children`每一项 , 如果 项 是数组，递归调用 `normalizeArrayChildren`；
2. 如果 项 是原始值，利用 `createTextVNode` 生成 VNode；
3. 其他情况，本身就是 vnode；
   - 如果存在两个连续的 text 节点，会把它们合并成一个 text 节点。
   - 如果 children 是一个列表并且列表还存在嵌套的情况，则根据 nestedIndex 去更新它的 key。

#### 总结

这一小节，主要阅读了`_createElement` 中

### 2. 创建 VNode

```js
// 5. 如果 tag 是字符串
if (typeof tag === 'string') {
  let Ctor
  ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)

  //  6. 如果是 内置的 html 标签
  if (config.isReservedTag(tag)) {
    // 创建元素节点
    vnode = new VNode(
      config.parsePlatformTagName(tag),
      data,
      children,
      undefined,
      undefined,
      context
    )
  } else if (
    (!data || !data.pre) &&
    isDef((Ctor = resolveAsset(context.$options, 'components', tag)))
  ) {
    // 7. 如果是已注册的组件
    vnode = createComponent(Ctor, data, context, children, tag)
  } else {
    // 8. 其他情况-未知标签
    vnode = new VNode(tag, data, children, undefined, undefined, context)
  }
} else {
  // tag 一个 Component 类型
  vnode = createComponent(tag, data, context, children)
}
```

- 简述一下上述的逻辑：
  `tag是字符串`

1.  如果是内置的节点，则创建一个普通的 VNode；
2.  如果是已注册的组件，`createComponent`。 _(createComponent 本质也是返回 VNode，这里暂时不做展开介绍)_；
3.  其他情况-未知的 VNode；

`其他情况`

4.  `createComponent`

创建 VNode , 其实就是`new VNode`，只不过是传入的参数不同。

## 个人思考

### cube-ui 中的 createElement

说说学习到现在的思考，`createElement` 这个单词我很早就开始好奇了，为啥呢？

之前使用 cube-ui 的时候，它内置的某些组件接受的传参就是 render 函数。 [点击这里](https://didi.github.io/cube-ui/#/zh-CN/docs/dialog)

就比如 对话框中插槽的示例：

```js
this.$createDialog(
  {
    type: 'alert',
    confirmBtn: {
      text: '我知道了',
      active: true,
    },
  },
  (createElement) => {
    return [
      createElement(
        'div',
        {
          class: {
            'my-title': true,
          },
          slot: 'title',
        },
        [
          createElement('div', {
            class: {
              'my-title-img': true,
            },
          }),
          createElement('p', '附近车少,优选出租车将来接您'),
        ]
      ),
      createElement(
        'p',
        {
          class: {
            'my-content': true,
          },
          slot: 'content',
        },
        '价格仍按快车计算'
      ),
    ]
  }
)
```

不得不说，编写`cube-ui` 的人很强。但是在阅读了 `createElement`之后，我自己有什么收获吗？

1. 知道了`cube-ui`这里的代码为什么要这样写，写的目的是什么，无非就是创建一个 VNode。
2. 我编写代码的时候，叫我直接写虚拟节点这种结构的代码。（稍微复杂点就有点难受）
   > **个人思考** 是否可以借用 Vue.js 的 `模板解析+render函数`，拿到模板解析后的 `Vnode`或者`createElement函数`，再将`Vnode`或者`createElement函数`返回给这个插槽。(当然只是我自己的思考)

### `Array.prototype.concat.apply([], children)`

这行代码我很认真的分析了一下，可能是因为一下子没有反应过来，关注点过多的关注于`concat`,这种借用`apply`扩展数组的方式，下次再遇见，我肯定可以快速反应过来了。

`Array.prototype.concat.apply([], children)` 这种扁平化方式，真的很巧妙。

## end

总结一下本文学习到的知识：

1. 基本了解了 `createElement` 源码实现逻辑。
2. 学习源码中，对子节点的处理；
3. 了解创建 VNode 基本逻辑；
