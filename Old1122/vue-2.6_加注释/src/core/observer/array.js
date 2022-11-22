/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 * 没有类型检查该文件，因为 flow 不能很好地发挥作用
 * 动态访问数组原型的方法
 */

import { def } from "../util/index";

// 1. 数组的原型
const arrayProto = Array.prototype;

// 2. 创建一个对象，原型指向数组的原型  `arrayMethods.__proto__ === arrayProto` true
export const arrayMethods = Object.create(arrayProto);

// 3. 定义需要处理的数组的方法，这里可以看到改写了 7 种方法；
const methodsToPatch = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

/**
 * Intercept mutating methods and emit events
 */
// 4. 拦截变化的方法并发出事件；
// 遍历我们需要拦截的方法
methodsToPatch.forEach(function (method) {
  // cache original method
  // 5. 缓存 原本数组身上的方法，用来后续调用
  const original = arrayProto[method];

  // 6. 在 arrayMethods上;  定义push，pop，shift，unshift，splice，sort，reverse方法;
  def(arrayMethods, method, function mutator(...args) {
    // 7. 先触发 数组原本对应方法
    const result = original.apply(this, args);

    // 8. 获取到 数据实例上的 Observer实例。
    const ob = this.__ob__;
    let inserted; // inserted : 插入项

    // 9. 选择方法
    switch (method) {
      case "push":
      case "unshift":
        // 9.1 push  unshift 传入的参数都是需要存入数组的参数，所以直接 =
        inserted = args;
        break;
      case "splice":
        // 9.2 splice 参数依次为 ①从何处处理 ②处理多少 ③要添加到数组的新元素 ，所以这里取第二个参数以后的参数。
        inserted = args.slice(2);
        break;
    }

    // 10. 有新添加来的数据，需要处理成响应式的
    if (inserted) ob.observeArray(inserted);

    // notify change
    // 11. 通知更改
    // 这个地方着重注意一下，我们自身实现数组的 7 种方法，使用它们的时候，也会触发视图更新，根本原因，就是因为这里`ob.dep.notify();`
    ob.dep.notify();

    // 12. result存储的是什么？ 存储的是数组本身对应的方法
    return result;
  });

  /* 
  所以最终返回的arrayMethod如下：
    {
      pop: ƒ mutator(...args)
      push: ƒ mutator(...args)
      reverse: ƒ mutator(...args)
      shift: ƒ mutator(...args)
      sort: ƒ mutator(...args)
      splice: ƒ mutator(...args)
      unshift: ƒ mutator(...args)
    }
  */
});
