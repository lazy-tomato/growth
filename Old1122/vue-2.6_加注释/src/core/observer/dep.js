/* @flow */

import type Watcher from "./watcher";
import { remove } from "../util/index";
import config from "../config";

let uid = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 * dep是一个可观察对象，它可以有多个
 * 指令订阅它。
 */
export default class Dep {
  static target: ?Watcher; // static 静态方法，等同于 `Dep.target`
  id: number; // 实例属性 (可以通过this直接访问) （数字类型）
  subs: Array<Watcher>; // 实例属性 (可以通过this直接访问) （数组类型，存储的是Watcher）

  constructor() {
    // 唯一id
    this.id = uid++;
    // 初始化 subs为一个空数组
    this.subs = [];
  }

  // sub subscribing/订阅
  // 添加订阅
  addSub(sub: Watcher) {
    this.subs.push(sub);
  }

  // 删除依赖
  removeSub(sub: Watcher) {
    // 其实就是利用数组的 splice 删除数组的一项;
    remove(this.subs, sub);
  }

  /* 
  Remove an item from an array. (删除数组的项)

  export function remove(arr: Array<any>, item: any): Array<any> | void {
    if (arr.length) {
      const index = arr.indexOf(item)
      if (index > -1) {
        return arr.splice(index, 1)
      }
    }
  }
  */

  // 依赖depend
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  // 通知
  notify() {
    // stabilize the subscriber list first （首先稳定订阅者列表）
    const subs = this.subs.slice();
    if (process.env.NODE_ENV !== "production" && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      // 如果不是异步运行，subs不会在调度程序中排序
      // 我们现在需要对它们进行排序，以确保它们正确地发射
      // 订单
      subs.sort((a, b) => a.id - b.id);
    }

    // 核心：遍历subs中的每一项，触发对应的 `update` 方法
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
// 当前被求值的目标监视器。
// 这是全局唯一的，因为只有一个监视器
// 可以一次求值。
Dep.target = null;
const targetStack = [];

// 这里会有一个数组 targetStack ，栈结构 （栈结构，特点：后进先出）

// 向 targetStack 中push数据
export function pushTarget(target: ?Watcher) {
  targetStack.push(target);
  Dep.target = target;
}

// 从 targetStack 取出最后一项
export function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}
