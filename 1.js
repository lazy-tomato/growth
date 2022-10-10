var newArr = [
  { key: 1, tag: 'div' },
  { key: 2, tag: 'div' },
  { key: 3, tag: 'div' },
  { key: 4, tag: 'div' },
]

var oldArr = [
  { key: 3, tag: 'div' },
  { key: 2, tag: 'h1' },
  { key: 4, tag: 'div' },
  { key: 1, tag: 'div' },
]

/* 1. 存储索引 */
// 新前的索引
var s = 0
// 新后的索引
var e = newArr.length - 1
// 旧前的索引
var oldS = 0
// 旧后的索引
var oldE = oldArr.length - 1

/* 2.存储对应的对象 */
// 新前对应的对象
var sNode = newArr[0]
// 新后对应的对象
var eNode = newArr[e]
// 旧前对应的对象
var oldSNode = oldArr[0]
// 旧后对应的对象
var oldENode = oldArr[oldE]

/* 2. 简易版的节点对比 */
function sameVnode(a, b) {
  return a.key === b.key && a.tag === b.tag && a.isComment === b.isComment
}

/* 3.多次对比，肯定是需要循环的，但是循环如何设计？ */

/*  4. 使用 while条件语句， 只要：旧前小于等于旧后，新前小于等于新后。  （从两端向中间遍历） */
while (oldS <= oldS && s <= e) {
  /* 
  1.  旧前 `=>` 新前
  2.  旧后 `=>` 新后
  3.  旧前 `=>` 新后
  4.  旧后 `=>` 新前
  */
  // 简易版本的 sameVnode

  //  4.1  旧前 `=>` 新前
  if (sameVnode(oldSNode, sNode)) {
    // patchVnode
    // ++oldS, ++s  (为什么要加加？因为两端的索引需要向中间移动，当两端的索引重合，结束while遍历)
    // 更新 oldSNode, sNode
  } else if (sameVnode(oldENode, eNode)) {
    //  4.2  旧后 `=>` 新后
    // patchVnode
    // --oldE, --e
    // 更新 oldENode, eNode
  } else if (sameVnode(oldSNode, eNode)) {
    //  4.3  旧前 `=>` 新后
    // patchVnode
    // --oldS, --e
    // insertBefore
    // 更新 oldSNode, eNode
  } else if (sameVnode(oldENode, sNode)) {
    //  4.4  旧后 `=>` 新前
    // patchVnode
    // --oldE, ++s
    // insertBefore
    // 更新 oldENode, sNode
  } else {
    // 4.5 新节点和所有的子节点进行对比
  }
}

/* 5. 其他情况处理 */
// 5.1 旧的先diff完， 剩下的就是：新项，添加到真实 dom 中
if (oldS > oldE) {
  // 未遍历的新子节点，全部添加到父元素中
} else if (newStartIdx > newEndIdx) {
  // 5.2 新的先diff完毕，旧的全部删除
  // 删除所有的多余项
}
