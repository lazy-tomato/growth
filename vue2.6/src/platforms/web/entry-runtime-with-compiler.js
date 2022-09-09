/* @flow */

import config from "core/config";
import { warn, cached } from "core/util/index";
import { mark, measure } from "core/util/perf";

import Vue from "./runtime/index";
import { query } from "./util/index";
import { compileToFunctions } from "./compiler/index";
import {
  shouldDecodeNewlines,
  shouldDecodeNewlinesForHref,
} from "./util/compat";

const idToTemplate = cached((id) => {
  const el = query(id);
  return el && el.innerHTML;
});

// 2. 包含编译模板的js文件中的 $mount
// 首先存储一下 原型上的 mount （）
const mount = Vue.prototype.$mount;

// 定义一个新的 $mount  在新的 $mount 中再去调用旧的 $mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // 元素存在然后 query
  el = el && query(el);

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== "production" &&
      warn(
        `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
      );
    return this;
  }

  // options其实就是配置，但是配置可以访问到template ！！！后续看到这个template在options如何初始化的，研究一下！
  const options = this.$options;

  // resolve template/el and convert to render function
  // 解析模板/el并转换为渲染函数
  // 没有渲染函数我们再走后续逻辑
  if (!options.render) {
    // 将模板编译成渲染函数，并且赋值给 options.render
    let template = options.template;

    /* 这里其实就是对 template为字符串且开头是#  template为dom元素的情况进行了处理 */
    if (template) {
      //1.  如果模板是字符串
      if (typeof template === "string") {
        // 首字母是 #  ;  charAt() 方法从一个字符串中返回指定的字符。
        if (template.charAt(0) === "#") {
          // 通过这个template名称，获取缓存中的模板
          template = idToTemplate(template);
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== "production" && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            );
          }
        }

        // template是字符串而且开头不是 # ，正常的template直接使用即可。

        // 2.判断是不是DOM元素
      } else if (template.nodeType) {
        // 直接拿到dom元素的innerHTML作为模板
        template = template.innerHTML;
      } else {
        // 不是字符串也不是dom元素, template会报错. 然后退出
        if (process.env.NODE_ENV !== "production") {
          warn("invalid template option:" + template, this);
        }

        return this;
      }
    } else if (el) {
      // 没有模板，有元素，返回的是 dom元素的 html 字符串
      template = getOuterHTML(el);
    }

    /* 这里才是正式的渲染逻辑！！！   当然没有template就不渲染 */
    if (template) {
      /* istanbul ignore if */
      // 性能标记
      if (process.env.NODE_ENV !== "production" && config.performance && mark) {
        mark("compile");
      }

      // 核心逻辑 compileToFunctions 编译成函数  `\src\compiler\to-function.js`
      const { render, staticRenderFns } = compileToFunctions(
        template,
        {
          outputSourceRange: process.env.NODE_ENV !== "production",
          shouldDecodeNewlines,
          shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments,
        },
        this
      );
      options.render = render;
      options.staticRenderFns = staticRenderFns;

      // 此时 options.render 就有渲染函数啦！

      /* istanbul ignore if */
      // 性能截止
      if (process.env.NODE_ENV !== "production" && config.performance && mark) {
        mark("compile end");
        measure(`vue ${this._name} compile`, "compile", "compile end");
      }
    }
  }

  // 执行原本真实的挂载。 （这个地方我们可以发现，包装后的挂载函数$mount，其实就是判断了一下是否有渲染函数，没有才会走 template 。）
  // 所以只要我们提供了 render函数 ，template非必须
  return mount.call(this, el, hydrating);
};

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML(el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML;
  } else {
    const container = document.createElement("div");
    container.appendChild(el.cloneNode(true));
    return container.innerHTML;
  }
}

// 这里注册了全局的Vue.compile
Vue.compile = compileToFunctions;

export default Vue;
