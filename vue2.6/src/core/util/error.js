/* @flow */

import config from "../config";
import { warn } from "./debug";
import { inBrowser, inWeex } from "./env";
import { isPromise } from "shared/util";
import { pushTarget, popTarget } from "../observer/dep";

// 可以看到后续所有的错误都会通过这个函数处理
export function handleError(err: Error, vm: any, info: string) {
  // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
  // See: https://github.com/vuejs/vuex/issues/1505
  pushTarget();
  try {
    if (vm) {
      let cur = vm;
      while ((cur = cur.$parent)) {
        // 1. 会触发父组件的 errorCaptured 函数
        const hooks = cur.$options.errorCaptured;
        if (hooks) {
          for (let i = 0; i < hooks.length; i++) {
            // 如果 cur.$options.errorCaptured 自身发生了错误，也会报告给全局
            try {
              // 如果
              const capture = hooks[i].call(cur, err, vm, info) === false;
              if (capture) return;
            } catch (e) {
              globalHandleError(e, cur, "errorCaptured hook");
            }
          }
        }
      }
    }

    // 2. 除了依次触发 父组件的 errorCaptured 函数；还会发送个全局的 config.errorHandle
    globalHandleError(err, vm, info);
  } finally {
    popTarget();
  }
}

// 使用错误处理try catch 调用
export function invokeWithErrorHandling(
  handler: Function,
  context: any,
  args: null | any[],
  vm: any,
  info: string
) {
  let res;
  try {
    // 有参数？ 调用 handler this指向为vm实例，
    res = args ? handler.apply(context, args) : handler.call(context);

    // 如果函数存在返回值，而且返回值是 promise，给他价catch处理
    if (res && !res._isVue && isPromise(res) && !res._handled) {
      res.catch((e) => handleError(e, vm, info + ` (Promise/async)`));
      // issue #9511
      // avoid catch triggering multiple times when nested calls
      res._handled = true;
    }
  } catch (e) {
    handleError(e, vm, info);
  }
  return res;
}

function globalHandleError(err, vm, info) {
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info);
    } catch (e) {
      // if the user intentionally throws the original error in the handler,
      // do not log it twice
      if (e !== err) {
        logError(e, null, "config.errorHandler");
      }
    }
  }
  logError(err, vm, info);
}

function logError(err, vm, info) {
  if (process.env.NODE_ENV !== "production") {
    warn(`Error in ${info}: "${err.toString()}"`, vm);
  }
  /* istanbul ignore else */
  if ((inBrowser || inWeex) && typeof console !== "undefined") {
    console.error(err);
  } else {
    throw err;
  }
}
