/* @flow */

import { toArray } from "../util/index";

export function initUse(Vue: GlobalAPI) {
  // 之前读过这个的源码。 无非就是 传入我们的Vue 调用 外部依赖的 install。 注册组件等逻辑
  Vue.use = function (plugin: Function | Object) {
    // 缓存
    const installedPlugins =
      this._installedPlugins || (this._installedPlugins = []);

    // 缓存中存在直接 return
    if (installedPlugins.indexOf(plugin) > -1) {
      return this;
    }

    // additional parameters
    // toArray我们之前看过，就是类数组转数组，第二个参数为开始截取的索引
    const args = toArray(arguments, 1);
    args.unshift(this);

    // 指定对应函数
    if (typeof plugin.install === "function") {
      plugin.install.apply(plugin, args);
    } else if (typeof plugin === "function") {
      plugin.apply(null, args);
    }

    // 缓存
    installedPlugins.push(plugin);
    return this;
  };
}
