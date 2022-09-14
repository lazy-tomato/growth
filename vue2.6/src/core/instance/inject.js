/* @flow */

import { hasOwn } from "shared/util";
import { warn, hasSymbol } from "../util/index";
import { defineReactive, toggleObserving } from "../observer/index";

// 初始化
export function initProvide(vm: Component) {
  // 读取配置的 provide
  const provide = vm.$options.provide;

  // 如果存在 provide，绑定 provided 到 _provided
  if (provide) {
    // 这里可以看到 provide可以为函数
    vm._provided = typeof provide === "function" ? provide.call(vm) : provide;
  }
}

// 初始化 inject
export function initInjections(vm: Component) {
  // 1. resolveInject
  const result = resolveInject(vm.$options.inject, vm);
  if (result) {
    // 2. shouldObserve = false;
    toggleObserving(false);
    Object.keys(result).forEach((key) => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== "production") {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
              `overwritten whenever the provided component re-renders. ` +
              `injection being mutated: "${key}"`,
            vm
          );
        });
      } else {
        // 开始 defineReactive
        defineReactive(vm, key, result[key]);
      }
    });

    // 3. shouldObserve = true;
    toggleObserving(true);

    // shouldObserve 设置为false 其实就是告诉 defineReactive 不需要将数据转换为响应式的
  }
}

// resolveInject实际上就是遍历 inject配置。自底向上搜索可用的注入内容。
export function resolveInject(inject: any, vm: Component): ?Object {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    // Inject为:any，因为flow不够智能，无法计算出缓存

    // 1.一个空对象
    const result = Object.create(null);

    // 2. hasSymbol： symbol和Reflect是否可用
    const keys = hasSymbol ? Reflect.ownKeys(inject) : Object.keys(inject);

    // 3. 遍历所有属性
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // #6574 in case the inject object is observed...
      // 如果观察到注入对象
      if (key === "__ob__") continue; // 响应式的数据

      const provideKey = inject[key].from;
      let source = vm;
      while (source) {
        // 使用 provided注入数据，其实本质就是注入到属性 _provided 中
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey];
          break;
        }

        // 一直寻找父元素，直到最顶层的父元素。
        source = source.$parent;
      }

      if (!source) {
        // 如果有默认的
        if ("default" in inject[key]) {
          const provideDefault = inject[key].default;

          // 这里的默认值是支持函数的
          result[key] =
            typeof provideDefault === "function"
              ? provideDefault.call(vm)
              : provideDefault;
        } else if (process.env.NODE_ENV !== "production") {
          warn(`Injection "${key}" not found`, vm);
        }
      }
    }

    // 自底向上搜索可用的注入内容，并将搜索结果返回。
    return result;
  }
}
