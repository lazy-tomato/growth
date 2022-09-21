/* @flow */
/* 和数据有关的方法 */

import config from "../config";
import Watcher from "../observer/watcher";
import Dep, { pushTarget, popTarget } from "../observer/dep";
import { isUpdatingChildComponent } from "./lifecycle";

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving,
} from "../observer/index";

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute,
  invokeWithErrorHandling,
} from "../util/index";

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop,
};

// 代理 `vm.xxxProps 或者 this.xxxProps` 实际上访问的是=> `vm._props.xxxProps`
export function proxy(target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key];
  };
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

// 初始化状态
export function initState(vm: Component) {
  // 这里的 _watchers 存储了这个组件的所有 watcher实例，无论是
  // 后续可以通过这里的 $des 方便后续组件的销毁 $destroy
  vm._watchers = [];

  const opts = vm.$options;
  // 根据实例的配置 （$options）依次初始化  props methods data computed watch
  // 这里的顺序很重要，也就解释了为什么 watch中为什么可以监听computed
  if (opts.props) initProps(vm, opts.props);
  if (opts.methods) initMethods(vm, opts.methods);
  if (opts.data) {
    initData(vm);
  } else {
    // 这里如果默认没有传入 data. 返回一个响应式的空对象
    observe((vm._data = {}), true /* asRootData */);
  }
  if (opts.computed) initComputed(vm, opts.computed);

  // nativeWatch是因为 火狐浏览器的object.prototype上有一个属性watch
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}

// 初始化 props ； 参数：组件实例 格式化过后的props
function initProps(vm: Component, propsOptions: Object) {
  // props的格式化是在  `\src\core\util\options.js`

  const propsData = vm.$options.propsData || {};

  const props = (vm._props = {});
  // vm._props === prop  // true 这里其实就是在 vm上添加了一个属性 vm._props

  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  // 缓存道具键，以便以后的道具更新可以使用数组迭代
  // 而不是动态对象键枚举。
  const keys = (vm.$options._propKeys = []);

  // 是否是根组件
  const isRoot = !vm.$parent;
  // root instance props should be converted
  // 不是根组件，不需要将props数据转换成响应式数据
  if (!isRoot) {
    toggleObserving(false);
  }

  // 开始遍历
  for (const key in propsOptions) {
    keys.push(key);

    // 校验 props，并拿到正式传递 的 props数据 (所有的props逻辑都在这个函数中)
    const value = validateProp(key, propsOptions, propsData, vm);

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      const hyphenatedKey = hyphenate(key);
      if (
        isReservedAttribute(hyphenatedKey) ||
        config.isReservedAttr(hyphenatedKey)
      ) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        );
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
              `overwritten whenever the parent component re-renders. ` +
              `Instead, use a data or computed property based on the prop's ` +
              `value. Prop being mutated: "${key}"`,
            vm
          );
        }
      });
    } else {
      defineReactive(props, key, value);
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    // 静态道具已经代理到组件的原型上了
    // 在Vue.extend()。我们只需要代理道具定义在
    // 实例化。
    if (!(key in vm)) {
      // 代理我们的 this.xxx 到 vm._props.xxx;
      proxy(vm, `_props`, key);
    }
  }

  // 开启响应式
  toggleObserving(true);
}

// 初始化data
function initData(vm: Component) {
  // 拿到data
  let data = vm.$options.data;

  // 判断传入的data是不是函数 是函数就 getData 处理一下，不是函数拿来直接使用，注意一下 他这里把传入的 data也在 vm._data中保存了一份
  data = vm._data = typeof data === "function" ? getData(data, vm) : data || {};

  // 不是对象进行警告。
  if (!isPlainObject(data)) {
    data = {};
    process.env.NODE_ENV !== "production" &&
      warn(
        "data functions should return an object:\n" +
          "https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function",
        vm
      );
  }

  // proxy data on instance
  // 代理数据到实例上
  const keys = Object.keys(data);
  const props = vm.$options.props;
  const methods = vm.$options.methods;
  let i = keys.length;
  while (i--) {
    const key = keys[i];
    // 是否和  methods props重 复
    if (process.env.NODE_ENV !== "production") {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== "production" &&
        warn(
          `The data property "${key}" is already declared as a prop. ` +
            `Use prop default value instead.`,
          vm
        );
    } else if (!isReserved(key)) {
      // 和 props 类似，这里也做了代理 ， 我们 this.xxxData 其实访问的还是 this._data.xxxData
      proxy(vm, `_data`, key);
    }
  }
  // observe data
  // 监听 data
  observe(data, true /* asRootData */);
}

export function getData(data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  // 在调用数据getter时禁用dep收集
  pushTarget();
  try {
    return data.call(vm, vm);
  } catch (e) {
    handleError(e, vm, `data()`);
    return {};
  } finally {
    popTarget();
  }
}

// 咱们重点看看以前不了解的 初始化 initComputed

// 定义一个 watcher 实例
const computedWatcherOptions = { lazy: true };
function initComputed(vm: Component, computed: Object) {
  // $flow-disable-line

  // 创建一个空对象 绑定到 vm._computedWatchers 上
  const watchers = (vm._computedWatchers = Object.create(null));
  // computed properties are just getters during SSR
  // 计算属性只是SSR期间的getter
  const isSSR = isServerRendering();

  // 遍历 computed
  for (const key in computed) {
    // 存储用户设置的计算属性定义
    const userDef = computed[key];

    // 函数 或者 存在get的对象
    const getter = typeof userDef === "function" ? userDef : userDef.get;

    if (process.env.NODE_ENV !== "production" && getter == null) {
      warn(`Getter is missing for computed property "${key}".`, vm);
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      // 为computed属性创建内部监视程序。
      watchers[key] = new Watcher(
        vm,
        getter || noop, // 重点就是这个 Watcher，第二个参数为 用户自定义的 getter
        noop,
        computedWatcherOptions
      );
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed methods defined
    // at instantiation here.
    // 控件上已经定义了组件定义的计算属性
    // 组件原型。我们只需要定义已定义的计算方法
    // 在这里实例化。
    if (!(key in vm)) {
      // 定义一个 计算属性到 vm上
      defineComputed(vm, key, userDef);
    } else if (process.env.NODE_ENV !== "production") {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(
          `The computed property "${key}" is already defined as a prop.`,
          vm
        );
      } else if (vm.$options.methods && key in vm.$options.methods) {
        warn(
          `The computed property "${key}" is already defined as a method.`,
          vm
        );
      }
    }
  }
}

// 定义计算属性到实例上
export function defineComputed(
  target: any,
  key: string,
  userDef: Object | Function
) {
  // 不是ssr
  const shouldCache = !isServerRendering();

  /* 
  sharedPropertyDefinition本质上就是一个基础的配置项，通常结合 Object.defineProperty使用
  const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop,
  };

  */

  // 是函数
  if (typeof userDef === "function") {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key) // 需要缓存，不是服务端渲染，计算属性会有花奴才能
      : createGetterInvoker(userDef); // 不需要缓存

    sharedPropertyDefinition.set = noop;
  } else {
    // 其他
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop;

    sharedPropertyDefinition.set = userDef.set || noop;
  }

  //
  if (
    process.env.NODE_ENV !== "production" &&
    sharedPropertyDefinition.set === noop
  ) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      );
    };
  }

  // 定义计算属性到vm上
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

// 创建 计算属性的 get---有缓存版
function createComputedGetter(key) {
  // 本身返回一个函数
  return function computedGetter() {
    // this._computedWatchers存在 就获取对应的key值
    const watcher = this._computedWatchers && this._computedWatchers[key];

    // 如果存在dirty
    if (watcher) {
      // watcher.dirty 用于标识 计算属性的返回值是否有变化 当它为true的时候，需要重新计算
      if (watcher.dirty) {
        watcher.evaluate();
      }

      // 手机依赖，用于将读取计算属性的 那个 watcher添加到计算属性所依赖的所有状态的依赖列表。
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value;
    }
  };
}

// 创建 getter 调用程序---无缓存版
function createGetterInvoker(fn) {
  return function computedGetter() {
    return fn.call(this, this);
  };
}

// 初始化方法；校验是否和 props重名。然后 for循环遍历对应的方法，绑定到this上
function initMethods(vm: Component, methods: Object) {
  const props = vm.$options.props;
  for (const key in methods) {
    if (process.env.NODE_ENV !== "production") {
      // 判断是不是函数
      if (typeof methods[key] !== "function") {
        warn(
          `Method "${key}" has type "${typeof methods[
            key
          ]}" in the component definition. ` +
            `Did you reference the function correctly?`,
          vm
        );
      }

      // 判断有没有和 props 冲突
      if (props && hasOwn(props, key)) {
        warn(`Method "${key}" has already been defined as a prop.`, vm);
      }

      // isReserved  不允许 $和_开头
      if (key in vm && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
            `Avoid defining component methods that start with _ or $.`
        );
      }
    }

    // 直接给 vm上绑定对应的属性，这就是为什么我们可以 this.xxx方法直接调用的原因
    vm[key] =
      typeof methods[key] !== "function" ? noop : bind(methods[key], vm);
    // 这里用了一个 bind函数 和我们正常使用的 bind效果类似，它只是做了一个兼容
  }
}

// 初始化 watch
function initWatch(vm: Component, watch: Object) {
  // watchy一个对象，键是需要观察的表达式，值是对应的回调函数函数，也可以是方法名，或者包含选项的对象。

  // 1. 遍历这个对象
  for (const key in watch) {
    // 2.拿到对应的key 1.如果是函数直接传递，就不需要做任何处理了
    const handler = watch[key];

    // 如果是数组
    if (Array.isArray(handler)) {
      // 依次遍历创建 watcher
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      // 创建 watcher
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher(
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  // 2. 如果是对象（）
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }

  // 3. 如果是字符串 （方法名）
  if (typeof handler === "string") {
    handler = vm[handler];
  }

  // 调用 vm的 $watch
  return vm.$watch(expOrFn, handler, options);
}

// 与数据相关的实例方法 有三个 watch set delete
export function stateMixin(Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {};
  dataDef.get = function () {
    return this._data;
  };
  const propsDef = {};
  propsDef.get = function () {
    return this._props;
  };
  if (process.env.NODE_ENV !== "production") {
    dataDef.set = function () {
      warn(
        "Avoid replacing instance root $data. " +
          "Use nested data properties instead.",
        this
      );
    };
    propsDef.set = function () {
      warn(`$props is readonly.`, this);
    };
  }
  Object.defineProperty(Vue.prototype, "$data", dataDef);
  Object.defineProperty(Vue.prototype, "$props", propsDef);

  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;

  // $watch 第一个参数接受：1.字符串；2.函数；
  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this;

    // 如果是普通的对象 (这里是针对 watch中直接第二个参数传入一个对象的情况.)
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options);
    }

    options = options || {};
    options.user = true;

    // 创建一个 watcher
    const watcher = new Watcher(vm, expOrFn, cb, options);

    // 如果首次加载，立即执行
    if (options.immediate) {
      const info = `callback for immediate watcher "${watcher.expression}"`;
      pushTarget(); // 将当前的 watcher 放到，Dep.target上；
      invokeWithErrorHandling(cb, vm, [watcher.value], vm, info); // 在 trycatch中执行 cb。
      popTarget(); // 处理 Dep.target
    }

    // 返回一个解除 watch的函数，
    return function unwatchFn() {
      watcher.teardown();
    };
  };
}
