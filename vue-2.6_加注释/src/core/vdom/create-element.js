/* @flow */

import config from "../config";
import VNode, { createEmptyVNode } from "./vnode";
import { createComponent } from "./create-component";
import { traverse } from "../observer/traverse";

import {
  warn,
  isDef,
  isUndef,
  isTrue,
  isObject,
  isPrimitive,
  resolveAsset,
} from "../util/index";

import { normalizeChildren, simpleNormalizeChildren } from "./helpers/index";

const SIMPLE_NORMALIZE = 1;
const ALWAYS_NORMALIZE = 2;

// 4. 创建元素节点
// wrapper function for providing a more flexible interface
// without getting yelled at by flow
// 包装函数来提供更多灵活的接口
// 不会被 flow 处理

// createElement 包裹了 _createElement函数.
// 真正创建 VNode 的方法是 _createElement.
export function createElement(
  context: Component, // 当前 组件的 Vue.js 实例。
  tag: any, // 元素的标签
  data: any, // 元素的属性
  children: any, // 当前节点的子节点列表
  normalizationType: any, // normalizationType *英译：标准化 类型*  表示子节点规范的类型，类型不同规范的方法也就不一样，它主要是参考 render 函数是编译生成的还是用户手写的。
  alwaysNormalize: boolean // *英译：总是 标准的*
): VNode | Array<VNode> {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children;
    children = data;
    data = undefined;
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE;
  }
  return _createElement(context, tag, data, children, normalizationType);
}

// 真正创建元素的函数
export function _createElement(
  context: Component, // 当前组件的 Vue.js实例
  tag?: string | Class<Component> | Function | Object, // 节点名称 类似于 p ul li 和 div 等
  data?: VNodeData, // 包含了一些节点上的数据 ； 例如 attrs,class,style;
  children?: any, // 当前节点的子节点列表； [vnode , vnode]
  normalizationType?: number // 标准化的类型，主要是参考 render是编译生成还是用户手写。
): VNode | Array<VNode> {
  // 1. 排除响应式的数据。
  if (isDef(data) && isDef(data.__ob__)) {
    process.env.NODE_ENV !== "production" &&
      warn(
        `Avoid using observed data object as vnode data: ${JSON.stringify(
          // 避免使用被观察数据对象作为vnode的数据
          data
        )}\n` + "Always create fresh vnode data objects in each render!",
        // 总是在每次渲染中创建新的vnode数据对象!
        context
      );
    return createEmptyVNode();
  }
  // object syntax in v-bind
  // 2. `:is` 语法
  if (isDef(data) && isDef(data.is)) {
    tag = data.is;
  }

  // 3. 没有tag,返回空的VNode
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode();
  }
  // warn against non-primitive key
  // 虚拟节点的 key ，不能为对象。
  if (
    process.env.NODE_ENV !== "production" &&
    isDef(data) &&
    isDef(data.key) &&
    !isPrimitive(data.key)
  ) {
    if (!__WEEX__ || !("@binding" in data.key)) {
      warn(
        "Avoid using non-primitive value as key, " +
          "use string/number value instead.",
        context
      );
    }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) && typeof children[0] === "function") {
    data = data || {};
    data.scopedSlots = { default: children[0] };
    children.length = 0;
  }

  // 4. 格式化 children   （两种格式化方式）
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children);
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children);
  }
  let vnode, ns;

  // 5. 如果 tag 是字符串
  if (typeof tag === "string") {
    let Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);

    //  6. 如果是 html标签
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      if (
        process.env.NODE_ENV !== "production" &&
        isDef(data) &&
        isDef(data.nativeOn) &&
        data.tag !== "component"
      ) {
        warn(
          `The .native modifier for v-on is only valid on components but it was used on <${tag}>.`,
          context
        );
      }

      // 创建元素节点
      vnode = new VNode(
        config.parsePlatformTagName(tag),
        data,
        children,
        undefined,
        undefined,
        context
      );
    } else if (
      (!data || !data.pre) &&
      // 注册组件
      isDef((Ctor = resolveAsset(context.$options, "components", tag)))
    ) {
      // component
      // 7. 如果是已注册的组件
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      // 8. 其他情况
      vnode = new VNode(tag, data, children, undefined, undefined, context);
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children);
  }

  if (Array.isArray(vnode)) {
    return vnode;
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns);
    if (isDef(data)) registerDeepBindings(data);
    return vnode;
  } else {
    return createEmptyVNode();
  }
}

function applyNS(vnode, ns, force) {
  vnode.ns = ns;
  if (vnode.tag === "foreignObject") {
    // use default namespace inside foreignObject
    // 在foreignObject中使用默认命名空间
    ns = undefined;
    force = true;
  }
  if (isDef(vnode.children)) {
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      const child = vnode.children[i];
      if (
        isDef(child.tag) &&
        (isUndef(child.ns) || (isTrue(force) && child.tag !== "svg"))
      ) {
        applyNS(child, ns, force);
      }
    }
  }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings(data) {
  if (isObject(data.style)) {
    traverse(data.style);
  }
  if (isObject(data.class)) {
    traverse(data.class);
  }
}
