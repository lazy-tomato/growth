/* @flow */

import { _Set as Set, isObject } from "../util/index";
import type { SimpleSet } from "../util/index";
import VNode from "../vdom/vnode";

const seenObjects = new Set();

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */

/**
 *  递归遍历一个对象以唤起所有转换
 *  getter，使每个嵌套的属性在对象内
 *  被收集为一个“深度”依赖项。
 */

export function traverse(val: any) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse(val: any, seen: SimpleSet) {
  let i, keys;
  const isA = Array.isArray(val);
  // 不是数组 不是对象 ； 冻结的对象； 是虚拟dom;
  if (
    (!isA && !isObject(val)) ||
    Object.isFrozen(val) ||
    val instanceof VNode
  ) {
    return;
  }

  // 存在响应式，拿到依赖的唯一标识 id
  if (val.__ob__) {
    const depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return;
    }
    // 添加我们的依赖id
    seen.add(depId);
  }

  // 如果是数组，循环数组，每一项都调用 _traverse
  if (isA) {
    i = val.length;
    while (i--) _traverse(val[i], seen);
  } else {
    // 如果对象 循环 Object中所有的key，执行一次读取，再递归子值。 其实就是这里的dep还没有被清除，这里读取了深层对象，触发了对应的get (递归调用，相当于，底层的对象的dep中都存储了我们这个 watcher)
    keys = Object.keys(val);
    i = keys.length;
    while (i--) _traverse(val[keys[i]], seen);
  }
}
