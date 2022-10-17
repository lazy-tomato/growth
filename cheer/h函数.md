# 彻底弄懂Vue2的配置项render



## start

在借助 vue-cli 创建的 vue2 项目中的 `main.js` 是这样初始化 Vue 的：

```js
import Vue from 'vue'
import App from './App.vue'

new Vue({
  render: (h) => h(App),
}).$mount('#app')
```

上述的`render`是什么意思？今天来彻底弄懂他







## App

首先 先看看我们引入的  App.vue 会变成什么样子

`App.vue`

```html
<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view/>
  </div>
</template>
```

`打印一下`

```js
import Vue from 'vue'
import App from './App.vue'

// 打印一下
console.dir(App)
console.dir(String(App.render))

new Vue({
  render: (h) => h(App),
}).$mount('#app')
```



`打印截图`

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/90cc911cb08a4835af5456a62f9c1fa2~tplv-k3u1fbpfcp-watermark.image?)

```js
function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    attrs: {
      id: "app"
    }
  }, [_c("div", {
    attrs: {
      id: "nav"
    }
  }, [_c("router-link", {
    attrs: {
      to: "/"
    }
  }, [_vm._v("Home")]), _vm._v(" | "), _c("router-link", {
    attrs: {
      to: "/about"
    }
  }, [_vm._v("About")])], 1), _c("router-view")], 1);
}
```





+ 首先 `import App from './App.vue'`，`App`是一个 js 对象.

  > 我们引入的 `.vue` 文件，会经过 `vue-loader` 的处理，会变成了一个 js 对象。

+ 这个 js 对象有哪些特点呢，主要是有一个关键的属性 `render`

  > render 函数，这个地方先不细究，后面说明





## new Vue 中 render又是什么呢？





### 官方介绍

**官网对render的说明**：https://v2.cn.vuejs.org/v2/api/#render


![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ff32ad16f6be4dd1883ad539f44d13a7~tplv-k3u1fbpfcp-watermark.image?)





















