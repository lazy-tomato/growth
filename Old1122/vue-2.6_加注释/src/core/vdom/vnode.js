/* @flow */

// 1. 在Vue中存在一个 VNode类,使用它可以实例化不同类型的 vnode实例。 不同的实例，各自表示不同类型的 DOM元素； （节点描述对象）
export default class VNode {
  // 2. 这里再复习一下, class的基础知识，class顶部定义的属性是实例对象自身的属性。
  // 所以  new VNode() 得到的对象自带 下面这么多属性。

  tag: string | void; // 元素节点的名称
  data: VNodeData | void;
  children: ?Array<VNode>; // 元素的子节点
  text: string | void; // 元素的文本内容
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder?
  isCloned: boolean; // is a cloned node?
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  devtoolsMeta: ?Object; // used to store functional render context for devtools
  fnScopeId: ?string; // functional scope id support

  constructor(
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
    this.ns = undefined;
    this.context = context;
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    this.key = data && data.key;
    this.componentOptions = componentOptions;
    this.componentInstance = undefined;
    this.parent = undefined;
    this.raw = false;
    this.isStatic = false;
    this.isRootInsert = true;
    this.isComment = false;
    this.isCloned = false;
    this.isOnce = false;
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child(): Component | void {
    return this.componentInstance;
  }
}

// 1. 创建一个注释节点
export const createEmptyVNode = (text: string = "") => {
  const node = new VNode();
  // 注释中的内容
  node.text = text;
  // vnode中的 isComment（是注释） 就是注释节点
  node.isComment = true;
  return node;

  /* 
  例如 真实的注释是：
  <!-- 番茄 -->

  这里创建的 vnode就是
  {
    text:"番茄",
    isComment:true
  }

  */
};

// 2. 创建一个文本节点
export function createTextVNode(val: string | number) {
  // 对标上述的 VNode的constructor，第四个参数就是 text
  return new VNode(undefined, undefined, undefined, String(val));
  // 所以输出的其实就是  { text:"番茄" }
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
// 优化的浅克隆
// 用于静态节点和 插槽节点，因为它们可以跨节点重用
// 多个渲染，克隆它们可以避免DOM操作依赖时的错误
// 他们的elm引用。

// 3. 克隆节点  （优化静态节点和插槽节点）
/* 
  以静态节点为例：组件的的某一个状态发生变化，静态节点因为他的内容不会改变，所以除了第一次执行渲染函数，后续不需要通过渲染函数来生产 vnode，直接拷贝一份vnode即可，提升性能。
  *我个人理解：渲染函数生成 vnode ,有些静态节点不用执行渲染函数的一些逻辑，直接拷贝之前的静态节点即可。*
*/
export function cloneVNode(vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // 拷贝子元素数组， 防止对原本子元素数组的修改。 (当然这里是 slice 浅拷贝)
    // a child.

    // （Vue中很多这中 && 连接的表达式）
    // 例如： `var a = b && b.slice;`  可以理解为：b 不存在直接返回 b，b 存在就返回 b.slice
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.asyncMeta = vnode.asyncMeta;

  // 可以看到上述代码，克隆节点，只需要把所有的属性全部赋值到新节点中,即可、

  // 当然两者也有差异， ①存储的堆地址是不一样的（两者完全是不一样的对象）; ②克隆节点的 isCloned (是否克隆) 属性为 true
  cloned.isCloned = true;
  return cloned;
}
