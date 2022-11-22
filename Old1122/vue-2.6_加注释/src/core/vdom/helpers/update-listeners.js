/* @flow */

import { warn, invokeWithErrorHandling } from "core/util/index";
import { cached, isUndef, isTrue, isPlainObject } from "shared/util";

// 主要作用是，解析事件修饰符
const normalizeEvent = cached(
  (
    name: string
  ): {
    name: string,
    once: boolean,
    capture: boolean,
    passive: boolean,
    handler?: Function,
    params?: Array<any>,
  } => {
    const passive = name.charAt(0) === "&";
    name = passive ? name.slice(1) : name;
    const once = name.charAt(0) === "~"; // Prefixed last, checked first
    name = once ? name.slice(1) : name;
    const capture = name.charAt(0) === "!";
    name = capture ? name.slice(1) : name;

    /* 
      ! .capture - 添加事件侦听器时使用 capture 模式。  
      ~ .once - 只触发一次回调。
      & .passive - (2.3.0) 以 { passive: true } 模式添加侦听器 
    */
    return {
      name,
      once,
      capture,
      passive,
    };
  }
);

export function createFnInvoker(
  fns: Function | Array<Function>,
  vm: ?Component
): Function {
  function invoker() {
    const fns = invoker.fns;

    // 1.传入的 fns是数组
    if (Array.isArray(fns)) {
      // 2.浅拷贝一份
      const cloned = fns.slice();

      // 3. 遍历并依次执行 invokeWithErrorHandling
      for (let i = 0; i < cloned.length; i++) {
        // 说白了 invokeWithErrorHandling 作用：执行 cloned[i]
        invokeWithErrorHandling(cloned[i], null, arguments, vm, `v-on handler`);
      }
    } else {
      // return handler return value for single handlers
      // 返回处理程序为单个处理程序返回值

      // 执行完函数之后的返回值， return
      return invokeWithErrorHandling(fns, null, arguments, vm, `v-on handler`);
    }
  }
  invoker.fns = fns;
  return invoker;
}

// 更新监听 简单来说，对比 传入的事件，  如果on中存在某个事件名，oldOn中不存在某个事件名，说明这个事件是需要新增的
export function updateListeners(
  on: Object, // 新的
  oldOn: Object, // 旧的
  add: Function, // 添加
  remove: Function, // 减少
  createOnceHandler: Function, // 创建只执行一次的。
  vm: Component // 组件示例
) {
  let name, def, cur, old, event;

  // for in 遍历对象 on ;  主要是判断那些事件，oldOn上不存在。调用add去注册这些事件
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];

    // normalize 正规的标准的；
    event = normalizeEvent(name);
    /* istanbul ignore if */
    if (__WEEX__ && isPlainObject(def)) {
      cur = def.handler;
      event.params = def.params;
    }

    // 如果新的事件不存在  `isUndef null || undefined`
    if (isUndef(cur)) {
      process.env.NODE_ENV !== "production" &&
        warn(
          `Invalid handler for event "${event.name}": got ` + String(cur),
          vm
        );
    } else if (isUndef(old)) {
      // oldOn中不存在。

      // 如果 cur上fns不存在
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur, vm);
      }

      // isTrue 是否为 true
      if (isTrue(event.once)) {
        // 创建执行一次的函数
        cur = on[name] = createOnceHandler(event.name, cur, event.capture);
      }

      add(event.name, cur, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      // 如果事件名在 on 和 oldOn都存在，但是并不相同。
      // 替换 旧的回调。将 新的事件指向的地址修改为旧的。
      old.fns = cur;
      on[name] = old;
    }
  }

  // 主要是判断那些事件，仅oldOn上存在。调用 remove 去删除这些事件
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      remove(event.name, oldOn[name], event.capture);
    }
  }
}
