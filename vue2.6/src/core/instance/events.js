/* @flow */

import {
  tip,
  toArray,
  hyphenate,
  formatComponentName,
  invokeWithErrorHandling,
} from "../util/index";
import { updateListeners } from "../vdom/helpers/index";

// 这个会在 _init中嗲用
export function initEvents(vm: Component) {
  // 创建一个空对象 _events 用于后续的存储事件，
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  const listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}

let target: any;

function add(event, fn) {
  target.$on(event, fn);
}

function remove(event, fn) {
  target.$off(event, fn);
}

function createOnceHandler(event, fn) {
  const _target = target;
  return function onceHandler() {
    const res = fn.apply(null, arguments);
    if (res !== null) {
      _target.$off(event, onceHandler);
    }
  };
}

export function updateComponentListeners(
  vm: Component,
  listeners: Object,
  oldListeners: ?Object
) {
  target = vm;
  updateListeners(
    listeners,
    oldListeners || {},
    add,
    remove,
    createOnceHandler,
    vm
  );
  target = undefined;
}

// 与事件相关的实例方法 是个 $on  $once  $off  $emit
export function eventsMixin(Vue: Class<Component>) {
  const hookRE = /^hook:/;

  // 1. 监听当前实例上的自定义事件
  Vue.prototype.$on = function (
    event: string | Array<string>,
    fn: Function
  ): Component {
    const vm: Component = this;

    // 1.1 如果是数组，递归遍历调用  vm.$on
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn);
      }
    } else {
      // 1.2 不为数组，向事件列表中添加回调，回调注册到事件列表中;

      // vm._events一个对象，存储事件，使用event遍历存储事件，没有就初始化为一个空数组，然后push方法进入
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm;
  };

  // 2. 监听一个自定义事件，但是只触发一次，在第一次触发之后移除监听器。
  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this;

    function on() {
      // 2.2 当函数开始执行，首先取消该事件
      vm.$off(event, on);

      // 2.3 然后开始执行函数。这个fn存在了闭包中，this执行为 vm
      fn.apply(vm, arguments);
    }

    // 2.4 为什么要绑定fn到 事件函数on的fn上？？
    // 因为 用户实际注册的是 fn;我们是使用了on代理的这个事件，在  vm.$off 中，它会对比传入的参数和实际的参数 `if (cb === fn || cb.fn === fn)`
    // 因为我们代理了fn 实际注册的是on。当用户先 `$once` ，自己手动 vm.$off(event, fn), 此时的 vm.$off 会找不到对应的fn。所以这里多一个绑定，vm.$off也多一个cb.fn === fn。解决这种情况
    on.fn = fn;

    vm.$on(event, on); // 2.1 利用 $on 注册一个事件on
    return vm;
  };

  // 3. 移除自定义事件监听器
  Vue.prototype.$off = function (
    event?: string | Array<string>,
    fn?: Function
  ): Component {
    const vm: Component = this;
    // 3.1 没有传递参数，默认移除所有事件监听器
    if (!arguments.length) {
      vm._events = Object.create(null);
      return vm;
    }

    // array of events
    // 3.2 如果是数组，循环移除
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn);
      }
      return vm;
    }

    // specific event 特殊事件
    // 如果是
    const cbs = vm._events[event];
    if (!cbs) {
      return vm;
    }

    // 如果没有事件，直接移除事件名
    if (!fn) {
      vm._events[event] = null;
      return vm;
    }
    // specific handler 特殊的回调
    let cb;
    let i = cbs.length;
    while (i--) {
      cb = cbs[i];

      // 在事件列表中找到相同的fn 进行移除操作 （稍微注意一下，这里从后向前遍历，防止因为splice删除项后对后续遍历的影响）
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1);
        break;
      }
    }
    return vm;
  };

  // 4. 触发当前实例的时间
  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this;

    // 不是生产的一些处理
    if (process.env.NODE_ENV !== "production") {
      const lowerCaseEvent = event.toLowerCase();
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
            `${formatComponentName(
              vm
            )} but the handler is registered for "${event}". ` +
            `Note that HTML attributes are case-insensitive and you cannot use ` +
            `v-on to listen to camelCase events when using in-DOM templates. ` +
            `You should probably use "${hyphenate(
              event
            )}" instead of "${event}".`
        );
      }
    }

    // 事件列表
    let cbs = vm._events[event];

    // 如果存在
    if (cbs) {
      // toArray 类数组转数组，第二个参数是遍历的起始位置
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      const args = toArray(arguments, 1);
      const info = `event handler for "${event}"`;

      for (let i = 0, l = cbs.length; i < l; i++) {
        // 使用错误处理调用  （使用trycatch来执行我们的函数）
        invokeWithErrorHandling(cbs[i], vm, args, vm, info);
      }
    }
    return vm;
  };
}
