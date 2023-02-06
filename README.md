### 环境搭建

pnpm workspace（monorepo）

eslint、prettier

tsconfig

husky、commitlint

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
