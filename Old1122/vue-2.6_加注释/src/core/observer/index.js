/* @flow */

import Dep from "./dep";
import VNode from "../vdom/vnode";
import { arrayMethods } from "./array";
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering,
} from "../util/index";

const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true;

export function toggleObserving(value: boolean) {
  shouldObserve = value;
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */

/**
 * 1.
 * 每个被观察对象附加的观察者类
 * 对象。一旦连接上，观察者将转换目标
 * 对象的属性键到getter/setter
 * 收集依赖关系并分发更新。
 */
export class Observer {
  // 2. class直接定义变量， 相当于 function Observer(){}  ;Observer.value;Observer.dep; Observer.vmCount;
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor(value: any) {
    // 3.存储 value
    this.value = value;

    // 4.创建一个依赖收集者
    this.dep = new Dep();

    // 5. 计数 把这个数据当成根data对象的实例数量
    this.vmCount = 0;

    // 6. 给 data 设置一个 __ob__ 属性，值为 Observer 实例
    // 这个地方可以知道为什么我们 Vue中的数据，打印出来会带有 '__ob__'
    def(value, "__ob__", this);

    // 7. 如果是数组 （数组最后再讲，先说对象）
    if (Array.isArray(value)) {
      // 7.1 可以使用对象的 __proto__ 属性
      if (hasProto) {
        protoAugment(value, arrayMethods);
      } else {
        // 7.2 不可以使用对象的 __proto__ 属性
        copyAugment(value, arrayMethods, arrayKeys);
      }
      // 7.3执行 observeArray
      this.observeArray(value);
    } else {
      // 8. 其他情况，对象
      this.walk(value);
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */

  /**
   * 9.
   * 遍历所有属性并将其转换为
   * getter setter。此方法只应在以下情况调用
   * 值类型为Object。
   */

  walk(obj: Object) {
    // 10. 调用对象的属性，循环执行 defineReactive(对象, 对象的属性名)
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i]);
    }
  }

  /**
   * Observe a list of Array items.
   */
  // 11.观察Array项
  observeArray(items: Array<any>) {
    // 12. 遍历数组的每一项，全部都observe一下。
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i]);
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
/**
 * 1.
 * 通过拦截来增强目标对象或数组
 * 使用原型链的 __proto__
 */

// 这里的函数名可以翻译为 原始增加
function protoAugment(target, src: Object) {
  /* eslint-disable no-proto */

  // 2. 这里做的操作就是，把数组的原型指向了我们定义的新对象`arrayMethod` 。新对象的原型是数组正式的原型。
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/**
 * 3.
 * 通过定义来扩大目标对象或数组
 * 隐藏属性
 */

/* istanbul ignore next */

// 这里的函数名可以翻译为 拷贝增加
function copyAugment(target: Object, src: Object, keys: Array<string>) {
  // 4. 遍历我们定义的 7 种方法；
  for (let i = 0, l = keys.length; i < l; i++) {
    // 4.1 拿到 方法名
    const key = keys[i];
    // 4.2 给目标数组添加方法，
    def(target, key, src[key]);
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
/**
 * 1.
 * 尝试为一个值创建一个观察者实例
 * 如果成功观察，返回新的观察者
 * 如果值已经有一个,返回现有的观察者，。
 */

// 2. 调用的时候 observe(data, true /* asRootData */);
export function observe(value: any, asRootData: ?boolean): Observer | void {
  // 3. value 需要处理的数据，asRootData 作为根数据

  // 4. 如果value 不是对象，或者是虚拟DOM。直接 return。 （这里 虚拟dom没有做响应式，目的是为了节约性能）
  if (!isObject(value) || value instanceof VNode) {
    return;
  }

  // 5. 定义一个变量 ob ，类型是Observer或者void
  let ob: Observer | void;

  // 6. hasOwn：value自身的属性上是否有 '__ob__' , 而且 value.__ob__是 Observer的实例
  // 简单来说：已经是响应式的，直接复用。
  if (hasOwn(value, "__ob__") && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    // 7. 需要监听；不是服务端渲染；是数组 或者 普通对象 ；可扩展；不是 Vue实例对象
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 8. new Observer(value)，传入的值为 我们的data
    ob = new Observer(value);
  }

  // 如果是asRootData，添加计数vmCount
  if (asRootData && ob) {
    ob.vmCount++;
  }

  // 10.返回 ob
  return ob;
}

/**
 * Define a reactive property on an Object.
 */
// 1. 在对象上定义响应式属性
export function defineReactive(
  obj: Object, // 传入的 对象：
  key: string, // 对象的 属性;
  val: any, //对象的属性值，在没有 getset的时候，直接返回对应的值。
  customSetter?: ?Function, // 自定义 setter
  shallow?: boolean // 是否是 浅层的响应式
) {
  // 2. new Dep() , 定义个对象用来 收集依赖。
  const dep = new Dep();

  // 3. Object.getOwnPropertyDescriptor() 方法返回指定对象上一个自有属性对应的属性描述符。  简单来说，拿到这个属性的配置。
  const property = Object.getOwnPropertyDescriptor(obj, key);
  // 4. 如果配置存在，如果 configurable===false  (该属性不可修改)，直接 return
  if (property && property.configurable === false) {
    return;
  }

  // cater for pre-defined getter/setters
  // 5. 满足预定义的getter/setter
  const getter = property && property.get;
  const setter = property && property.set;
  if ((!getter || setter) && arguments.length === 2) {
    // 6. 如果：没有getter或者有setter；而且传入的参数长度为2。设置第三个参数 val为
    val = obj[key];
  }

  // 7. 不是浅层的，监听 val;  childOb是布尔值
  let childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true, // 可以枚举
    configurable: true, // 可以配置

    // 8.定义 get
    get: function reactiveGetter() {
      // 8.1 拿到真实的值
      const value = getter ? getter.call(obj) : val;

      // 8.2 收集依赖
      if (Dep.target) {
        dep.depend();

        // 8.3 子对象的 Observer实例,存在，子对象也收集依赖
        if (childOb) {
          childOb.dep.depend();

          // 数组处理
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value;
    },

    // 9.定义 set
    set: function reactiveSetter(newVal) {
      // 9.1 真实的值
      const value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */

      // 9.2 `newVal === value` 值没有改变的时候不触发后续逻辑；   (newVal !== newVal && value !== value) 这是什么意思? 防止 NaN == NaN (false) https://github.com/vuejs/vue/issues/4236
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return;
      }
      /* eslint-enable no-self-compare */

      // 9.3 自定义 Setter
      if (process.env.NODE_ENV !== "production" && customSetter) {
        customSetter();
      }
      // #7981: for accessor properties without setter
      // 9.4 对于没有setter的访问器属性
      if (getter && !setter) return;

      // 9.5 有 setter 走 setter
      if (setter) {
        setter.call(obj, newVal);
      } else {
        // 9.6 没有则直接赋值给 val
        val = newVal;
      }

      // 10. 处理子元素
      childOb = !shallow && observe(newVal);

      // 11. 通知订阅者。
      dep.notify();
    },
  });
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */

/**
 * 设置一个对象的属性。添加新属性和
 * 如果属性没有更改，则触发更改通知
 * 已经存在。
 */
// 两个限制， 不能是 vue实例;不能是实例的根数据对象;
export function set(target: Array<any> | Object, key: any, val: any): any {
  if (
    process.env.NODE_ENV !== "production" &&
    // 如果是 undefined 或 null; 或者是原始值
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(
      `Cannot set reactive property on undefined, null, or primitive value: ${target}`
    );
  }

  // 如果是数组
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // Math.max() 函数返回一组数中的最大值。
    target.length = Math.max(target.length, key); // 这里是为了保证 突然增大数组的长度，响应式的逻辑未处理

    // 添加我们传入的值到数据中
    target.splice(key, 1, val);
    return val;
  }

  // 如果 key 值已经存在对象中，且不是原型的属性；（已经是响应式的了无需处理）
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val;
  }

  // 获取到 Observer 实例上的 ob
  const ob = (target: any).__ob__;

  // 如果是vue实例，或者是Vue实例的根数据对象 （可以理解 this.$data 就是根数据，不允许使用 $set）
  if (target._isVue || (ob && ob.vmCount)) {
    // 如果是 undefined 或 null; 或者是原始值
    process.env.NODE_ENV !== "production" &&
      warn(
        "Avoid adding reactive properties to a Vue instance or its root $data " +
          "at runtime - declare it upfront in the data option."
      );
    return val;
  }

  // 没有 ob ,说明数据不是响应式的
  if (!ob) {
    // 直接赋值即可
    target[key] = val;
    return val;
  }

  // 前置的if都不满足了。说明用户在响应式数据上新增了一个属性，这种情况需要追踪新增的属性的变化。
  defineReactive(ob.value, key, val);

  // 依赖触发， 变化通知
  ob.dep.notify();
  return val;
}

/**
 * Delete a property and trigger change if necessary.
 * 如果需要，删除属性并触发更改。
 */
export function del(target: Array<any> | Object, key: any) {
  if (
    process.env.NODE_ENV !== "production" &&
    // 如果是 undefined 或 null; 或者是原始值 ---同Vue.$set
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(
      `Cannot delete reactive property on undefined, null, or primitive value: ${target}`
    );
  }

  // 数组，利用splice，直接改
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1);
    return;
  }

  // ---同Vue.$set 排除Vue实例 和 根对象
  const ob = (target: any).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== "production" &&
      warn(
        "Avoid deleting properties on a Vue instance or its root $data " +
          "- just set it to null."
      );
    return;
  }

  // 如果 属性不是自身的属性，直接 return
  if (!hasOwn(target, key)) {
    return;
  }

  // 删除对应的key
  delete target[key];

  // 不是响应式的不做处理（这个地方可以理解为，浅层监听的 watch，有些深层的属性不需要watch，就会走这个情况）
  if (!ob) {
    return;
  }

  // 手动触发 ！！ 有作者在想，直接在代码中 `.__ob__`  手动通知不就ok了？ 虽然可以但是不建议这样做、
  ob.dep.notify();
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 * 当数组被 “接触” 时，收集数组元素的依赖关系
 * 我们不能像属性getter那样拦截数组元素访问
 */
function dependArray(value: Array<any>) {
  // 遍历数组
  for (let e, i = 0, l = value.length; i < l; i++) {
    // e是数组的每一项
    e = value[i];

    // e存在；e.__ob__存在；e.__ob__.dep开始收集依赖， 这里的依赖是存储在 observe实例上。！！注意只有数组会想起在
    e && e.__ob__ && e.__ob__.dep.depend();

    // 如果项还是数组。递归收集依赖。
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}
