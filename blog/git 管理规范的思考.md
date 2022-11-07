# git 管理规范的思考

## start

- 最近因为 git 分支的操作不规范，浪费了大量的时间来修复问题。
- 事后复盘问题的原因，给我最大的感受是 git 管理规范非常重要。
- 今天写一个文章记录一下自己的想法。

## 问题：

`随便聊聊：`

最开始码代码的时候，是我一个人维护好几个项目，正因为是我一个人，所以对于 git 管理，相对来说比较简单。

但是随着时间发展，项目越来越大了，好几个小伙伴一起做一个项目，伴随而来的就是 git 管理不规范带来的各种问题。

例如：

1. 分支污染：误将未测试的新功能分支合并到生产分支上。
2. 分支丢失：误删重要分支。

## 解决思路：

首先，一个系统分多套环境，每套环境对应一个线上分支进行管理。

我们每次无论是修复 bug，还是新增功能，都应该从生产分支，切一个分支出来，开发新功能。

禁止直接修改线上分支。

只能通过 merge 其他分支的方式来，修改对应线上分支。

如果线上分支和新功能分支之间有冲突，那么必须从线上分支上创建一个新的分支用来合并，然后再把新功能合并到这个新分支上，本地解决完毕冲突后，再将 线上分支和新分支合并。

## 示例

说了一堆文字，我举例演示一下。

1. 首先我一个项目有三套环境，分别为 dev ， uat ，pro；分别为：开发，测试，生产；

   > 线上分支**禁止 commit，禁止 push**。

2. 我有新需求了，需要新的分支用来开发，我从 pro 上切一个新的分支用来开发新功能，分支名为 `featrue-fixbug1007`。

   > ```shell
   > git checkout pro
   > git checkout -b featrue-fixbug1007
   > ```

3. 新需求开发完毕了，需要部署开发环境调试，怎么办？

4. 如果没有冲突：

   ```shell
   # 切换到 dev 分支
   git checkout dev

   # 将 featrue-fixbug1007 合并到 dev分支
   git merge featrue-fixbug1007
   ```

5. 如果有冲突：

   ```shell
   # 切换到 dev 分支
   git checkout dev

   # 依据 dev 分支创建一个合并分支 dev_merge_featrue-fixbug1007
   git checkout -b dev_merge_featrue-fixbug1007

   # 将新功能合并到我们的新创建的分支
   git merge featrue-fixbug1007

   # 合并 dev 和 新创建的分支
   git checkout dev
   git merge dev_merge_featrue-fixbug1007
   ```

## end

- 最后在说几句，对待 git 操作，应当格外谨慎。
