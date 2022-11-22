/* @flow */

import config from "../config";
import { initUse } from "./use";
import { initMixin } from "./mixin";
import { initExtend } from "./extend";
import { initAssetRegisters } from "./assets";
import { set, del } from "../observer/index";
import { ASSET_TYPES } from "shared/constants";
import builtInComponents from "../components/index";
import { observe } from "core/observer/index";

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive,
} from "../util/index";

export function initGlobalAPI(Vue: GlobalAPI) {
  // config
  const configDef = {};
  configDef.get = () => config;
  if (process.env.NODE_ENV !== "production") {
    configDef.set = () => {
      warn(
        "Do not replace the Vue.config object, set individual fields instead."
      );
    };
  }
  Object.defineProperty(Vue, "config", configDef);

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive,
  };

  // 其实还是走的 实例上的  $set
  Vue.set = set;

  // 其实还是走的 实例上的  $del
  Vue.delete = del;

  // 其实还是走的 实例上的  $nextTick
  Vue.nextTick = nextTick;

  // 2.6 explicit observable API
  Vue.observable = (obj) => {
    observe(obj);
    return obj;
  };

  // 配置其实是在这里初始化的，默认一个空对象
  Vue.options = Object.create(null);
  ASSET_TYPES.forEach((type) => {
    Vue.options[type + "s"] = Object.create(null);
  });
  /* 
  ASSET_TYPES   [
                  'component',
                  'directive',
                  'filter'
                ]
  */

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  // 该函数用于标识扩展所有plain-object的"base"构造函数
  // Weex的多实例场景中的组件。
  //  @tomato, 这就对应 创建组件中的 vm.$options._base 取值的出处了。 （当然，options是vue原本的配置，而$options存储的是，用户配置合并之后的配置）
  Vue.options._base = Vue;

  // extend就是把 b的属性给a  目前 builtInComponents有这些内置组件 <keep-alive>、<transition> 和 <transition-group>
  extend(Vue.options.components, builtInComponents);

  initUse(Vue);
  initMixin(Vue);
  initExtend(Vue);

  // 初始化资源注册
  initAssetRegisters(Vue);
}
