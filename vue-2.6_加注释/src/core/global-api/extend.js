/* @flow */

import { ASSET_TYPES } from "shared/constants";
import { defineComputed, proxy } from "../instance/state";
import { extend, mergeOptions, validateComponentName } from "../util/index";

export function initExtend(Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0;
  let cid = 1;

  /**
   * Class inheritance
   */
  // 类继承
  // 全局api 和实例方法不同， 全局api是挂载 Vue上的方法，实例方法是挂载在 Vue.prototype

  // 传入的是模板配置，返回值是一个函数;  Vue.extend主要作用还是 创建一个子类，然后让这个子类继承 Vue 身上的一些功能；
  // 整体来说 创建一个 Sub函数，继承父级，如果是直接 Vue.extend,则Sub继承于 Vue构造函数。
  Vue.extend = function (extendOptions: Object): Function {
    // 1. 传入的是一个对象
    extendOptions = extendOptions || {};

    // 2. 后续是使用  Vue.extend 调用的，所以 这里的this指向 Vue
    const Super = this;
    const SuperId = Super.cid;

    // 3. 性能考虑，添加了缓存策略
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId];
    }

    // 4. 校验 name 是否合规
    const name = extendOptions.name || Super.options.name;
    if (process.env.NODE_ENV !== "production" && name) {
      validateComponentName(name);
    }

    // 5.定义一个函数 Sub
    const Sub = function VueComponent(options) {
      this._init(options);
    };

    // 6. 修改原型
    Sub.prototype = Object.create(Super.prototype);
    // 7.修改原型的构造函数的执行
    Sub.prototype.constructor = Sub;
    // 8. id++
    Sub.cid = cid++;
    // 9. 合并配置
    Sub.options = mergeOptions(Super.options, extendOptions);
    // 10. 存储Super到 super属性上
    Sub["super"] = Super;

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    // 对于props和computed属性，我们将代理getter定义为on
    // 扩展时的Vue实例，在扩展原型上。这
    // 避免对每个创建的实例调用Object.defineProperty。

    // 11. 存在 props，则初始化 props
    if (Sub.options.props) {
      initProps(Sub);
    }

    // 12. 存在 computed，则初始化computed
    if (Sub.options.computed) {
      initComputed(Sub);
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type];
    });
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub;
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    // 在扩展时保留对super选项的引用。
    // 稍后实例化时，我们可以检查Super的选项是否有
    // 更新。
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    Sub.sealedOptions = extend({}, Sub.options);

    // cache constructor
    // 缓存构造函数
    cachedCtors[SuperId] = Sub;
    return Sub;
  };
}

function initProps(Comp) {
  const props = Comp.options.props;
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key);
  }
}

function initComputed(Comp) {
  const computed = Comp.options.computed;
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key]);
  }
}
