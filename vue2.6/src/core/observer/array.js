/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
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
// 4. 拦截变化的方法并发出事件；  遍历我们需要拦截的方法
methodsToPatch.forEach(function (method) {
  // cache original method
  // 5. 缓存原始的方法，用来后续调用
  const original = arrayProto[method];

  // 6. 在 以数组原型为原型的对象上;  定义push...等;  执行操作，
  def(arrayMethods, method, function mutator(...args) {
    // 7. 调用数组本身的方法
    const result = original.apply(this, args);

    // 8. 定义一个比那里 存储 this.__ob__
    const ob = this.__ob__;
    let inserted; // inserted : 插入

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

    // 10. 有新添加来的数据，需要监听一下响应式
    if (inserted) ob.observeArray(inserted);
    // notify change
    // 通知更改
    ob.dep.notify();

    // 11.  result存储的是什么？ 存储的是数组本身对应的方法
    return result;
  });

  //
  /* 
  
  def 给对象赋值 所以此时的：
  arrayMethod：

  Array 
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
