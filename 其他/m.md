## 源码中的 $mount

在 main.js 中，配置完 `render` 之后，会调用 `.$mount('#app')`。从源码角度来分析一下。

mount 挂载的意思，也就是将我们的组件挂载到我们真实 dom 上。而$mount 的源码在 Vue 中有多次定义。

主要说两个。

### 基础功能的 $mount

其他的 `$mount`, 都是在这个基础的`$mount`上做的扩展。主要目的是为了复用公共的逻辑。

`src\platforms\web\runtime\index.js`

```js
// public mount method
// 公开的挂载方法
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // 处理挂载元素
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```

### 带 模板编译的 $mount

运行时的 Vue.js 使用的就是基础的 `$mount`，完整版本的 Vue.js 使用的是带编译模板的 `$mount`。

我们来看看带编译模板的 `$mount`相关的源码。（为了方便理解，我做了很多精简，想看源码的，可以依据路径自行查看）

`src\platforms\web\entry-runtime-with-compiler.js`

```js
// 包含编译模板的js文件中的 $mount

// 1. 首先存储一下 原型上的 mount()
const mount = Vue.prototype.$mount

// 2. 定义一个新的 $mount
Vue.prototype.$mount = function (el) {
  el = el && query(el)

  // 3. 禁止挂载在 `<html> or <body>`
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' &&
      warn(
        `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
      )
    return this
  }

  // 4. 其实就是 new Vue() 传入的配置对象
  const options = this.$options

  // 5. 没有 render配置项
  if (!options.render) {
    // 6. 拿到 template 的配置项
    let template = options.template
    if (template) {
      // compileToFunctions，就是模板编译的入口函数；
      // 会依据传入的 template 返回一个 render函数
      // 对应文件目录`\src\compiler\to-function.js`
      const { render } = compileToFunctions(template)

      options.render = render
    }
  }

  // 执行备份的 mount
  return mount.call(this, el)
}
```
