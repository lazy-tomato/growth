/* @flow */

import { emptyNode } from "core/vdom/patch";
import { resolveAsset, handleError } from "core/util/index";
import { mergeVNodeHook } from "core/vdom/helpers/index";

// 虚拟DOM在触发钩子函数是，下面的代码对应的函数会被执行
export default {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives(vnode: VNodeWithData) {
    updateDirectives(vnode, emptyNode);
  },
};

// 实际上底层开始执行的这里
function updateDirectives(oldVnode: VNodeWithData, vnode: VNodeWithData) {
  // 新节点 旧节点只要有一个虚拟节点存在 directives 那么就执行_update
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode);
  }
}

function _update(oldVnode, vnode) {
  /* export const emptyNode = new VNode("", {}, []); */
  const isCreate = oldVnode === emptyNode; // 虚拟节点是否是一个新建的节点
  const isDestroy = vnode === emptyNode; // 当新节点不存在，旧节点存在
  const oldDirs = normalizeDirectives(
    oldVnode.data.directives,
    oldVnode.context
  ); // 旧指令集合
  const newDirs = normalizeDirectives(vnode.data.directives, vnode.context); // 新指令集合

  const dirsWithInsert = []; // 触发 inserted 指令钩子函数的指令列表
  const dirsWithPostpatch = []; // 触发 componentUpdated 钩子函数的指令列表

  // 对比
  let key, oldDir, dir;
  for (key in newDirs) {
    oldDir = oldDirs[key];
    dir = newDirs[key];

    if (!oldDir) {
      // 以前没有,即首次触发。
      // new directive, bind
      callHook(dir, "bind", vnode, oldVnode);
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir);
      }
    } else {
      // 以前存在,即更新操作
      // existing directive, update
      dir.oldValue = oldDir.value;
      dir.oldArg = oldDir.arg;
      callHook(dir, "update", vnode, oldVnode);
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir);
      }
    }
  }

  // 依次触发对应逻辑
  if (dirsWithInsert.length) {
    const callInsert = () => {
      for (let i = 0; i < dirsWithInsert.length; i++) {
        callHook(dirsWithInsert[i], "inserted", vnode, oldVnode);
      }
    };
    if (isCreate) {
      mergeVNodeHook(vnode, "insert", callInsert);
    } else {
      callInsert();
    }
  }

  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, "postpatch", () => {
      for (let i = 0; i < dirsWithPostpatch.length; i++) {
        callHook(dirsWithPostpatch[i], "componentUpdated", vnode, oldVnode);
      }
    });
  }

  //
  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook(oldDirs[key], "unbind", oldVnode, oldVnode, isDestroy);
      }
    }
  }
}

const emptyModifiers = Object.create(null);

// 将 模板中使用的指令 从用户注册的自定义指令集合中取出
function normalizeDirectives(
  dirs: ?Array<VNodeDirective>,
  vm: Component
): { [key: string]: VNodeDirective } {
  const res = Object.create(null);
  if (!dirs) {
    // $flow-disable-line
    return res;
  }
  let i, dir;
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i];
    if (!dir.modifiers) {
      // $flow-disable-line
      dir.modifiers = emptyModifiers;
    }
    res[getRawDirName(dir)] = dir;
    dir.def = resolveAsset(vm.$options, "directives", dir.name, true);
  }
  // $flow-disable-line
  return res;
}

function getRawDirName(dir: VNodeDirective): string {
  return (
    dir.rawName || `${dir.name}.${Object.keys(dir.modifiers || {}).join(".")}`
  );
}

function callHook(dir, hook, vnode, oldVnode, isDestroy) {
  const fn = dir.def && dir.def[hook];
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
    } catch (e) {
      handleError(e, vnode.context, `directive ${dir.name} ${hook} hook`);
    }
  }
}
