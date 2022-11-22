/* @flow */

import { warn } from "core/util/index";

export * from "./attrs";
export * from "./class";
export * from "./element";

/**
 * Query an element selector if it's not an element already.
 */

// 这里可以看到可以传入 真实的dom对象，可以传递字符串，如果没有找到，会报错+创建一个 div；
export function query(el: string | Element): Element {
  if (typeof el === "string") {
    const selected = document.querySelector(el);
    if (!selected) {
      process.env.NODE_ENV !== "production" &&
        warn("Cannot find element: " + el);
      return document.createElement("div");
    }
    return selected;
  } else {
    return el;
  }
}
