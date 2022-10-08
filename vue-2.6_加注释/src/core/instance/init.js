/* @flow */

import config from "../config";
import { initProxy } from "./proxy";
import { initState } from "./state";
import { initRender } from "./render";
import { initEvents } from "./events";
import { mark, measure } from "../util/perf";
import { initLifecycle, callHook } from "./lifecycle";
import { initProvide, initInjections } from "./inject";
import { extend, mergeOptions, formatComponentName } from "../util/index";

let uid = 0;

// initMixin 会在 `/src/core/instance/index.js`中执行 (传入的是 Vue构造函数)
export function initMixin(Vue: Class<Component>) {
  // Vue 原型上添加 _init方法
  // 如果是 _开头，则可以理解为是提供给内部使用的内部属性。如果是 $开头是提供给用户使用的外部属性。
  Vue.prototype._init = function (options?: Object) {
    // 1. 存储当前的this,到变量 vm 上
    const vm: Component = this;

    // a uid
    // 2. 实例的一个唯一标识
    vm._uid = uid++;

    // 性能检测
    let startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`;
      endTag = `vue-perf-end:${vm._uid}`;
      mark(startTag);
    }

    // a flag to avoid this being observed
    // 避免被观察到的标志 (Vue实例，不被转换为响应式)
    vm._isVue = true;

    // merge options
    // 3. 主要操作就是合并配置options 到  vm.$options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }

    // 4.开始初始化 例如 生命周期，事件，Render state....
    // expose real self
    vm._self = vm;

    // initLifecycle函数，向实例中挂载属性。
    initLifecycle(vm);

    // initEvents  主要做了：  1.定义属性_events;  2.初始化了父组件注册了的子组件
    initEvents(vm);
    initRender(vm);
    callHook(vm, "beforeCreate");

    // initInjections 主要做了：初始化inject, 本质上是，匹配 子组件到上层组件的的_provided 和 inject是否有同名属性。
    initInjections(vm); // resolve injections before data/props

    // initState 主要做了： 依次初始化： props methods data computed watch
    initState(vm);

    // initProvide 主要做了：初始化 provide
    initProvide(vm); // resolve provide after data/props
    callHook(vm, "created");

    // 主要分为四个阶段;
    // 初始化阶段;
    // 模板编译阶段;
    // 挂载阶段;
    // 卸载阶段;

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(`vue ${vm._name} init`, startTag, endTag);
    }

    // ！！！如果元素存在，就开始挂载
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}

export function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {
  const opts = (vm.$options = Object.create(vm.constructor.options));
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

  const vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}

export function resolveConstructorOptions(Ctor: Class<Component>) {
  let options = Ctor.options;
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super);
    const cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options;
}

function resolveModifiedOptions(Ctor: Class<Component>): ?Object {
  let modified;
  const latest = Ctor.options;
  const sealed = Ctor.sealedOptions;
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {};
      modified[key] = latest[key];
    }
  }
  return modified;
}
