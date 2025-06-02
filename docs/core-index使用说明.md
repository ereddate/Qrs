# core/index.js 使用说明

## 一、概述
core/index.js 是框架的核心模块，提供事件总线、响应式系统、组件管理、虚拟节点等核心功能，以下是主要模块的使用说明。

---

## 二、核心模块说明

### 1. EventBus 事件总线
- **功能**：实现组件间的事件订阅/发布机制，支持 `on`（监听）、`emit`（触发）、`off`（移除监听）、`once`（一次性监听）方法。
- **使用示例**：
  ```javascript
  import { eventBus } from './core/index.js';
  // 监听事件
  eventBus.on('userLogin', (user) => console.log('用户登录：', user));
  // 触发事件
  eventBus.emit('userLogin', { name: '张三' });
  // 移除监听
  const callback = () => {};
  eventBus.on('test', callback);
  eventBus.off('test', callback); // 移除特定回调
  eventBus.off('test'); // 移除所有test事件监听
  ```

### 2. reactive 响应式系统
- **功能**：将普通对象转换为响应式对象，数据变化时自动触发依赖更新。
- **使用示例**：
  ```javascript
  import { reactive } from './core/index.js';
  const state = reactive({ count: 0 }, (key, oldVal, newVal) => {
    console.log(`属性${key}变化：${oldVal}→${newVal}`);
  });
  state.count = 1; // 触发回调，输出：属性count变化：0→1
  ```

### 3. Component 组件类
- **功能**：定义可复用的组件，支持生命周期（`beforeCreated`/`created`/`beforeMount`/`mounted`等）、`data`响应式数据、`computed`计算属性、`watch`监听。
- **使用示例**：
  ```javascript
  import { Component, createApp } from './core/index.js';
  const App = new Component({ 
    data() { return { count: 0 }; },
    computed: { doubleCount() { return this.data.count * 2; } },
    watch: { count(newVal) { console.log('count变为：', newVal); } },
    render() { return `<div>${this.data.count}</div>`; }
  });
  createApp(App).mount('#app');
  ```

### 4. VNode 虚拟节点
- **功能**：通过`createElem`函数创建虚拟DOM节点，优化DOM更新效率。
- **使用示例**：
  ```javascript
  import { createElem } from './core/index.js';
  const vnode = createElem('div', { class: 'container' }, 'Hello World');
  // 渲染为真实DOM
  document.body.appendChild(vnode);
  ```

### 5. 任务队列机制（queueJob/flushJobs）
- **功能**：异步批量执行更新任务，避免频繁DOM操作。
- **使用场景**：响应式数据变化时，自动将更新任务加入队列，通过`Promise.resolve().then(flushJobs)`批量执行。

### 6. nextTick
- **功能**：在下次DOM更新循环结束后执行回调，用于获取更新后的DOM状态。
- **使用示例**：
  ```javascript
  import { nextTick } from './core/index.js';
  state.count = 1;
  nextTick(() => {
    console.log('DOM已更新');
  });
  ```

---

## 三、注意事项
- EventBus 是单例，全局共享，需注意事件命名冲突。
- reactive 对象的属性需提前定义，新增属性需通过`deleteProperty`触发响应。
- Component 生命周期钩子中避免同步更新数据，可能导致无限循环。
- VNode 渲染时会缓存结果（`_cachedEl`），频繁动态内容建议关闭缓存。