# Vue2-Observer 实例的 dep 和闭包中的 dep 有何区别？

## start

- 此前学习 Vue2 源码。对 Vue 源码中两次出现的`new Dep()`，不清楚它们的区别，写一个文章记录一下。

## 正文

Vue2 源码中有两处通过`new Dep`生成`dep实例`：

`1. Observer实例上的dep`

```js
export class Observer {
  value;
  dep;
  vmCount;
  constructor(value) {
    this.value = value;

     /* Observer的实例上有一个 dep 属性 */
    this.dep = new Dep();

    def(value, "__ob__", this);

    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods);
      } else {
        copyAugment(value, arrayMethods, arrayKeys);
      }
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }
```

`2. 定义getter，setter中dep`

```js
export function defineReactive(obj, key, val, customSetter, shallown) {
  /* 这个地方也定义了一个dep */
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable,
    configurable,

    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val

      if (Dep.target) {
        dep.depend()

        if (childOb) {
          childOb.dep.depend()

          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },

    set: function reactiveSetter(newVal) {
      /* ... */
    },
  })
}
```

> 为了方便后续介绍，我对两种`dep`的名称做一下缩减。
>
> - `1. Observer实例上的dep` => `Observer实例上的dep`
> - `2. 定义getter，setter中dep` => `闭包中的dep`

既然是 `new Dep()`，肯定是想要实现某些功能。想要弄懂这两种 `dep` 的区别，先看看在源码中它们如何工作的。

### 1. 依赖收集

在打包输出的`dist`文件夹中，找到完整的 Vue.js 源码，全局搜索一下`dep.depend()` _（收集依赖的方法）_。

**仅三处做了依赖收集**

```js
// 第 1 种情况
// 当触发对象属性 getter 的时候，`闭包中的dep`会收集依赖。
dep.depend()

// 第 2 种情况
// 当触发对象属性 getter 的时候，若属性值有更深的子层级。`Observer实例上的dep`会收集依赖。
childOb.dep.depend()

// 第 3 种情况
// 当触发对象属性 getter的时候，数据有更深的子层级且子层级是数组类型。递归遍历数组的每一项，若数组项上存在`Observer的实例`，则对应的`Observer实例上的dep`会收集依赖。
function dependArray(value) {
  for (var e = void 0, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
```

`情况说明：`

1. 当触发对象属性 getter 的时候，`闭包中的dep`会收集依赖。
2. 当触发对象属性 getter 的时候，若属性值有更深的子层级。`Observer实例上的dep`会收集依赖。
3. 当触发对象属性 getter 的时候，数据有更深的子层级且子层级是数组类型。递归遍历数组的每一项，若数组项上存在`Observer的实例`，则对应的`Observer实例上的dep`会收集依赖。

   > 写到这里我有点疑惑，为什么数组的情况，还要额外处理？
   >
   > - 因为数组中如果存储的`不是对象或数组`，对应数组项不会有`Observer的实例`；
   > - 因为数组中如果存储的`是对象或数组`，对应数组项身上就会有`Observer的实例`；
   > - (核心原因：数组的每一项并不是都会被设置 getter，所以这里需要递归处理一下数组)

`举个例子`

写一个 Html 页面测试

```html
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <title>lazy_tomato</title>
  </head>

  <body>
    <div id="app">
      <div>{{ c }}</div>
    </div>
    <script src="./vue.js"></script>
    <script>
      new Vue({
        el: '#app',
        data() {
          return {
            b: '你好呀',
            c: [{}],
            d: {},
          }
        },
      })
    </script>
  </body>
</html>
```

`修改一下Vue源码，加入打印：`

```js
if (Dep.target) {
  dep.depend()
  /* 这里 */
  console.log('111')
  if (childOb) {
    childOb.dep.depend()
    /* 这里 */
    console.log('222')

    if (Array.isArray(value)) {
      dependArray(value)
    }
  }
}

function dependArray(value) {
  for (var e = void 0, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (e && e.__ob__ && e.__ob__.dep) {
      /* 这里 */
      console.log('333')
    }
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
```

`实验结果：`

1. 如果页面没有使用 `data` 中的数据，那么三种情况的 `dep.depend()` 都不会触发。(_因为没有触发 getter_)
2. 如果页面仅仅使用到了 b，b 是简单类型的数据，没有子层级， `1`会触发， `2、3`不触发;
3. 如果页面仅仅使用到了 c，c 是数组类型的数据，而且数组中的项是对象，`1、2、3`会触发 `2`不触发;
4. 如果页面仅仅使用到了 d，d 是对象类型的数据，有子层级，`1、2`会触发, `3`不触发;

`结论：`
由上面的结果，可以得到结论：

- `闭包中的dep` 关注的是对象属性；
- `Observer实例上的dep`，关注的是对象中属性值是对象或者是数组的情况；

### 2. 通知更新

在打包输出的`dist`文件夹中，找到完整的 Vue.js 源码，全局搜索一下`dep.notify()`_（通知更新的方法）_。仅四处做了依赖收集。

```js
// 第 1 种情况
// 当触发对象属性 setter 的时候，`闭包中的dep`会通知更新。
dep.notify()

// 还有三处，都是使用 `ob.dep.notify()` 的方式会通知更新。
// 场景分别为：
// 1. 改写数组的七个方法
// 2. set 方法
// 3. del 方法
```

`结论：`

- `闭包中的dep` 用于由对象本身修改而触发 setter 函数导致闭包中的 Dep 通知所有的 Watcher 对象。
- `Observer实例上的dep` 则是在对象本身增删属性或者数组变化的时候被触发的 Dep。

### 思考

看到上述的内容，可以想到两种 dep 其实是各司其职。

1. `闭包中的 dep` 用于管理对象本身修改而触发的依赖。

2. `Observer 实例上的 dep` 用于对象本身增删属性或者数组变化的时候被触发的依赖。

> 它可以用于弥补 `Object.defineProperty()` 的缺陷。
>
> - 对象属性 新增或者删除；
> - 数组方法不支持响应式；
> - 通过数组索引修改数据项；

#### 拓展一

如果把 Observer 中初始化 dep 的代码注释掉，那么：`$set,$del,重写的七种数组方法` 都将失效。

```js
class Observer {
  constructor(value) {
    // this.dep = new Dep(); // 正确的写法
    this.dep = { depend() {}, notify() {} }
    /* ... */
  }
}
```

#### 拓展二

既然源码中的 `$set,$del,重写的七种数组方法` ，通知更新，使用的是`ob.dep.notify()`。
那我们是否可以自己手动通知吗？

> 理论是可行的，但是 Vue 源码相对来说，做了更多特殊场景的考虑。所以用官方提供的 API 更可靠。

`手动通知的案例`

```html
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <title>lazy_tomato</title>
  </head>

  <body>
    <div id="app">
      <ul>
        <li v-for="item in list" :key="item">{{item}}</li>
      </ul>
      <h2 @click="foo">点击我通过数组索引添加数据</h2>
      <h2 @click="bar">点击我手动更新通知依赖更新</h2>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/vue@2.7.10/dist/vue.js"></script>
    <script>
      new Vue({
        el: '#app',
        data() {
          return {
            list: [1, 2, 3],
          }
        },
        methods: {
          // 点击我向数组中添加数据
          foo() {
            let length = this.list.length
            this.list[length] = 'tomato' + length // 通过数组索引修改数据，默认是无法通知依赖更新的。
            console.log(this.list)
          },

          // 点击我手动更新通知更新
          bar() {
            this.list.__ob__.dep.notify()
          },
        },
      })
    </script>
  </body>
</html>
```

`效果图：`
![20221025152951.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0250a3d73a6a4993bdc2bbbe7e216bea~tplv-k3u1fbpfcp-watermark.image?)

## end

- 本文就 Dep 的初始化和基础的使用场景做了学习。

`再总结一下：`

- `闭包中的dep` 用于由对象本身修改而触发 setter 函数导致闭包中的 Dep 通知所有的 Watcher 对象。
- `Observer实例上的dep` 则是在对象本身增删属性或者数组变化的时候被触发的 Dep。
