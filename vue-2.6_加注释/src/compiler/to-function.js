/* @flow */

import { noop, extend } from "shared/util";
import { warn as baseWarn, tip } from "core/util/debug";
import { generateCodeFrame } from "./codeframe";

type CompiledFunctionResult = {
  render: Function,
  staticRenderFns: Array<Function>,
};

function createFunction(code, errors) {
  try {
    return new Function(code);
  } catch (err) {
    errors.push({ err, code });
    return noop;
  }
}

//
export function createCompileToFunctionFn(compile: Function): Function {
  const cache = Object.create(null);

  return function compileToFunctions(
    template: string,
    options?: CompilerOptions,
    vm?: Component
  ): CompiledFunctionResult {
    // 1. 将 options 属性混合到空对象中，目的是让 options 当做可选参数
    options = extend({}, options);
    const warn = options.warn || baseWarn;
    delete options.warn;

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production") {
      // detect possible CSP restriction
      try {
        new Function("return 1");
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn(
            "It seems you are using the standalone build of Vue.js in an " +
              "environment with Content Security Policy that prohibits unsafe-eval. " +
              "The template compiler cannot work in this environment. Consider " +
              "relaxing the policy to allow unsafe-eval or pre-compiling your " +
              "templates into render functions."
          );
        }
      }
    }

    // check cache
    // 检查缓存

    const key = options.delimiters
      ? String(options.delimiters) + template
      : template;

    // 2. 如果 缓存汇总有对应的模板，不会重新编译
    if (cache[key]) {
      return cache[key];
    }

    // compile
    // 3. 开始编译  将代码template编译成  ast 在编译成 代码字符串 ， 存储在 compiled.render 中； compile具体实现待定
    const compiled = compile(template, options);

    // check compilation errors/tips
    if (process.env.NODE_ENV !== "production") {
      if (compiled.errors && compiled.errors.length) {
        if (options.outputSourceRange) {
          compiled.errors.forEach((e) => {
            warn(
              `Error compiling template:\n\n${e.msg}\n\n` +
                generateCodeFrame(template, e.start, e.end),
              vm
            );
          });
        } else {
          warn(
            `Error compiling template:\n\n${template}\n\n` +
              compiled.errors.map((e) => `- ${e}`).join("\n") +
              "\n",
            vm
          );
        }
      }
      if (compiled.tips && compiled.tips.length) {
        if (options.outputSourceRange) {
          compiled.tips.forEach((e) => tip(e.msg, vm));
        } else {
          compiled.tips.forEach((msg) => tip(msg, vm));
        }
      }
    }

    // turn code into functions
    // 将代码转换为函数
    const res = {};
    const fnGenErrors = [];

    // 4. 代码转换为函数  new Function()大法，此时 res.render其实就是一个函数了
    res.render = createFunction(compiled.render, fnGenErrors);
    res.staticRenderFns = compiled.staticRenderFns.map((code) => {
      return createFunction(code, fnGenErrors);
    });

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production") {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn(
          `Failed to generate render function:\n\n` +
            fnGenErrors
              .map(({ err, code }) => `${err.toString()} in\n\n${code}\n`)
              .join("\n"),
          vm
        );
      }
    }

    // 5. 缓存起来
    return (cache[key] = res);
  };
}
