/* @flow */

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  invokeWithErrorHandling,
  noop,
} from "../util/index";

import { traverse } from "./traverse";
import { queueWatcher } from "./scheduler";
import Dep, { pushTarget, popTarget } from "./dep";

import type { SimpleSet } from "../util/index";

let uid = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 * 观察者解析表达式，收集依赖项，
 * 并在表达式值更改时触发回调。
 * 这用于$watch() api和指令。
 */

// 1. 整体看下来，Watcher 其实就是一个类
export default class Watcher {
  // 2. 实例上有一堆属性 ， vm 是我们的Vue实例
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor(
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    // 3. Watcher实例上存储一下我们的 vm
    this.vm = vm;
    if (isRenderWatcher) {
      vm._watcher = this;
    }

    // 4. 一个vm （一个组件处理渲染的 watcher，还有我们自定义的watcher或者计算属性，这里都存储在 `vm._watchers` 上）
    vm._watchers.push(this);
    // options
    if (options) {
      this.deep = !!options.deep;
      this.user = !!options.user;
      this.lazy = !!options.lazy;
      this.sync = !!options.sync;
      this.before = options.before;
    } else {
      this.deep = this.user = this.lazy = this.sync = false;
    }
    this.cb = cb;
    this.id = ++uid; // uid for batching
    this.active = true;
    this.dirty = this.lazy; // for lazy watchers
    this.deps = []; //存放dep的容器
    this.newDeps = []; // 存储新dep的容器
    this.depIds = new Set(); //去重dep
    this.newDepIds = new Set(); // 去重 新dep容器
    this.expression =
      process.env.NODE_ENV !== "production" ? expOrFn.toString() : "";
    // parse expression for getter
    if (typeof expOrFn === "function") {
      // 如果传入的是函数，函数中使用到的数据都会被观察，只要有一个数据改变，watcher就会收到通知。
      // computed就是这么一个原理。 其次仔细想想 正常的渲染watcher，getter是去触发 render，render获取数据。这种传入函数的watcher，getter会去获取函数中使用的数据。
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn);
      if (!this.getter) {
        this.getter = noop;
        process.env.NODE_ENV !== "production" &&
          warn(
            `Failed watching path: "${expOrFn}" ` +
              "Watcher only accepts simple dot-delimited paths. " +
              "For full control, use a function instead.",
            vm
          );
      }
    }

    // 5. 整体看下来，都是在 watcher 实例上，初始化一些属性；

    // 6. 注意这里： this.lazy(是否是计算属性) ，渲染的 watcher的 this.lazy 为 false,会执行 `this.get()`
    this.value = this.lazy ? undefined : this.get();
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   * 求值getter，并重新收集依赖项。
   */
  get() {
    // 7.
    // 7.1 向一个数组中添加当前的 watcher实例;
    // 7.2 `Dep.target = this` => `Dep.target = 当前的 watcher`
    pushTarget(this);
    let value;
    const vm = this.vm;
    try {
      // 8.

      /* 
      1.执行 this.getter
      2.渲染的时候，实际执行的是： () => {vm._update(vm._render(), hydrating);};
      3. vm._render()会获取 data 的值，触发了数据的 get,从而实现依赖收集
      */
      value = this.getter.call(vm, vm);
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`);
      } else {
        throw e;
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      // “触摸”每个属性，因此它们都被跟踪为
      // 依赖深度观察
      if (this.deep) {
        traverse(value);
      }

      // 9. 收集完依赖之后,删除当前依赖
      popTarget();
      this.cleanupDeps();
    }
    return value;
  }

  /**
   * Add a dependency to this directive.
   * 添加新的依赖到当前的指令
   */
  addDep(dep: Dep) {
    // 10 获取到 dep实例的id
    const id = dep.id;

    // 11. 如果新 depid数组没有这个id
    if (!this.newDepIds.has(id)) {
      // 添加这个id
      this.newDepIds.add(id); // 去重后的 dep id的数 Set   (新)
      this.newDeps.push(dep); // 存储dep的容器    （新）

      // 如果 去重的数组 （旧） 也没有这个 dep.id, dep中收集一下当前的 watcher
      if (!this.depIds.has(id)) {
        // 收集这个 watcher
        dep.addSub(this);
      }
    }
  }

  /**
   * Clean up for dependency collection.
   * 清理依赖项收集。
   */

  // 感觉是清除旧的依赖
  cleanupDeps() {
    let i = this.deps.length; // 存储 deps
    while (i--) {
      const dep = this.deps[i];

      // 如果新的newDepIds没有这个 dep.id
      if (!this.newDepIds.has(dep.id)) {
        // dep中删除当前 watcher
        dep.removeSub(this);
      }
    }

    // 1. 设置this.depIds存储的最新id的Set ;2. 清除原本的存储id的Set
    let tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();

    // 上面替换的是存储id的 Set（Set特性不会重复）
    // 这里的作用 `this.deps`更新为最新dep的数组的引用地址，原本旧的数组引用给释放掉。
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update() {
    /* istanbul ignore else */
    if (this.lazy) {
      // 懒
      this.dirty = true;
    } else if (this.sync) {
      // 异步
      this.run();
    } else {
      // 主要是执行 queueWatcher
      queueWatcher(this);
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   * 调度器的工作界面。
   * 将被调度程序调用。
   */
  run() {
    if (this.active) {
      // 触发视图更新
      const value = this.get();
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        // 深度观测者和对象/数组上的观测者应该同时发射
        // 当值相同时，因为值可能
        // 有突变。
        isObject(value) ||
        this.deep
      ) {
        // 设置新值。
        // set new value
        const oldValue = this.value;
        this.value = value;

        // 执行回调函数
        if (this.user) {
          const info = `callback for watcher "${this.expression}"`;
          invokeWithErrorHandling(
            this.cb,
            this.vm,
            [value, oldValue],
            this.vm,
            info
          );
        } else {
          this.cb.call(this.vm, value, oldValue);
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   * 评估观察者的价值。
   * 这只适用于懒惰的观察者。
   */
  evaluate() {
    // 执行get，重新计算值
    this.value = this.get();

    // 设置 diety 为 false
    this.dirty = false;
  }

  /**
   * Depend on all deps collected by this watcher.
   * 依赖于这个观察者收集的所有深度。
   */
  depend() {
    // this.deps属性保存了所有状态的dep实例，每个dep实例保存了它的所有依赖
    // 简单来说，就是遍历了 this.deps, 将当前的 watcher放到所有的依赖项中。
    let i = this.deps.length;
    while (i--) {
      this.deps[i].depend();
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  // 从所有依赖项的订阅者列表中删除 自身
  teardown() {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      // 从vm的监视列表中删除self
      // 这是一个有点昂贵的操作，所以我们跳过它
      // 如果虚拟机正在被销毁。
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this);
      }

      // this.deps => watcher本身记录着它自己订阅了谁
      // 当需要
      let i = this.deps.length;
      while (i--) {
        this.deps[i].removeSub(this);
      }
      this.active = false;
    }
  }
}
