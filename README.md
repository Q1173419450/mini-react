### 环境搭建

pnpm workspace（monorepo）

eslint、prettier

tsconfig

husky、commitlint

#### 三种调试手段

- 打包对应主包，使用 crate-react-app 创建一个新的 react 项目，使用 **软链接** 的调试模式进行调试（问题：每次修改代码都需要重新打包）
- 使用 vite 进行 **热更新** 调试（问题：热更新失效问题【使用 eslint-plugin-react-refresh 解决】）
- 使用 **测试用例** 进行测试

### jsx & 打包流程构建

编译时由 Babel 完成

运行时由我们编写方法

定义 jsx 方法

### FiberNode

用于 React createElement 和 真实 DOM 之间数据处理的桥梁

数据结构 -- FiberNode

### 更新

#### 常见触发更新的方式

- ReactDOM.createRoot().render
- this.setState
- useState 的 dispatch 方法

希望实现一套统一的更新机制

- 兼容上述触发更新的方式
- 方便后续扩展

#### 更新机制模型

- 数据结构 -- Update
- 消费 update 的数据结构 -- UpdateQueue

#### 注：workLoop 的疑问

如果 flags 有多次的 placement，那对 flags 会不会出现覆盖的影响呢？

```html
<div>
	<a>
		<b></b>
	</a>
</div>

<!-- B 组件有 placement 的更新、A也有 placement 的更新，root 的 subtreeFlags 会不会被影响到呢？  -->
```

第一次解答：subtree 只知道 子组件需要 placement，如何 placement 还需要看后面课程

### ReactDOM

react 内部的三个阶段：

- schedule 阶段
- render 阶段（beginWork、completeWork）
- commit 阶段（commitWork）

commit 阶段有三个子阶段

- beforeMutation 阶段
- mutation 阶段
  - 突变：操作 UI 的方式、将 DOM 节点的颜色从 红色 变成 蓝色，这个过程就叫做突变
- layout 阶段

### Diff 算法

`单/多节点` 是指 更新后是 `单/多节点`

#### 单节点 diff 算法

单节点需要支持：

- 插入：placement
- 删除：ChildDeletion

> key 相同，type 相同，复用节点

例如: A1 B2 C3 => A1

> key 相同，type 不同，不存在复用的可能性

例如: A1 B2 C3 => D1

> key 不同，type 相同，无法复用
> key 不同，type 不同，无法复用

#### 多节点 diff 算法

多节点需要支持:

- 插入：placement
- 删除：ChildDeletion
- 移动：placement

### 支持 Fragment

type 为 Fragment 的 ReactElement，对单一节点的 Diff 需要考虑 Fragment 的情况。

> 1、Fragment 包裹其他组件

```js
<>
	<div>1</div>
	<div>2</div>
</>

// 对应DOM
<div></div>
<div></div>
```

```js
// jsx 转换
jsx(Fragment, {
	children: [jsx('div', {}), jsx('div', {})]
});
```

> 2. Fragment 与其他组件同级

children 为数组类型，则进入 reconcileChildrenArray 方法，数组中的某一项为 Fragment，所以需要增加「type 为 Fragment 的 ReactElement 的判断」，同时 beginWork 中需要增加 Fragment 类型的判断。

```js
<ul>
  <>
    <li>1</li>
    <li>2</li>
  </>
  <li>3</li>
  <li>4</li>
</ul>

// 对应DOM
<ul>
  <li>1</li>
  <li>2</li>
  <li>3</li>
  <li>4</li>
</ul>
```

> 3.  数组形式的 Fragment

```js
// arr = [<li>c</li>, <li>d</li>]

<ul>
  <li>a</li>
  <li>b</li>
  {arr}
</ul>

// 对应DOM
<ul>
  <li>a</li>
  <li>b</li>
  <li>c</li>
  <li>d</li>
</ul>
```
