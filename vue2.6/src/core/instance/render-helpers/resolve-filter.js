/* @flow */

import { identity, resolveAsset } from "core/util/index";

/**
 * Runtime helper for resolving filters
 * 用于解析过滤器的运行时帮助程序
 */
export function resolveFilter(id: string): Function {
  // 使用该函数查找过滤器，如果找到了，则将过滤器返回，找不到返回  identity
  return resolveAsset(this.$options, "filters", id, true) || identity;

  // identity 的代码  `(_) => _`;
  // 返回的是 参数本身
}
