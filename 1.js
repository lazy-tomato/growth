// 5. 如果 tag 是字符串
if (typeof tag === 'string') {
  let Ctor
  ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)

  //  6. 如果是 内置的 html 标签
  if (config.isReservedTag(tag)) {
    // 创建元素节点
    vnode = new VNode(
      config.parsePlatformTagName(tag),
      data,
      children,
      undefined,
      undefined,
      context
    )
  } else if (
    (!data || !data.pre) &&
    isDef((Ctor = resolveAsset(context.$options, 'components', tag)))
  ) {
    // 7. 如果是已注册的组件
    vnode = createComponent(Ctor, data, context, children, tag)
  } else {
    // 8. 其他情况-未知标签
    vnode = new VNode(tag, data, children, undefined, undefined, context)
  }
} else {
  // tag 一个 Component 类型
  vnode = createComponent(tag, data, context, children)
}
1
