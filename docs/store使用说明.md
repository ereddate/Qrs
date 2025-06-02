# Store 使用说明

## 1. 概述
`core/store.js` 提供了一个简单的状态管理库，支持状态响应式、Mutation提交、Action分发、Getter计算以及状态订阅功能。

## 2. 核心功能
### 2.1 状态管理（state）
- 响应式状态：通过`reactive`函数实现，状态变更会自动通知订阅者。
- 初始化：创建Store实例时通过`options.state`传入初始状态。

### 2.2 Mutation提交
- 作用：同步修改状态。
- 方法：调用`commit(mutationName, payload)`，需在初始化时通过`options.mutations`定义具体Mutation。
- 示例：
  ```javascript
  // 定义Mutation
  const mutations = { increment: (state) => state.count++ };
  // 提交Mutation
  store.commit('increment');
  ```

### 2.3 Action分发
- 作用：处理异步操作或复杂逻辑，最终通过提交Mutation修改状态。
- 方法：调用`dispatch(actionName, payload)`，需在初始化时通过`options.actions`定义具体Action。
- 示例：
  ```javascript
  // 定义Action
  const actions = { 
    incrementAsync: ({ commit }) => setTimeout(() => commit('increment'), 1000)
  };
  // 分发Action
  store.dispatch('incrementAsync');
  ```

### 2.4 Getter获取
- 作用：计算派生状态（基于当前状态的只读值）。
- 方法：调用`getGetter(getterName)`，需在初始化时通过`options.getters`定义具体Getter。
- 示例：
  ```javascript
  // 定义Getter
  const getters = { doubleCount: (state) => state.count * 2 };
  // 获取Getter
  const double = store.getGetter('doubleCount');
  ```

### 2.5 状态订阅
- 作用：监听状态变更（如更新UI）。
- 方法：调用`subscribe(callback)`注册回调函数，状态变更时回调会被触发。
- 示例：
  ```javascript
  store.subscribe((state) => console.log('当前计数：', state.count));
  ```

## 3. 实例初始化（结合src/store/index.js）
```javascript
import Store from '../../core/store.js';

// 1. 定义状态、Mutation、Action、Getter
const state = { count: 0 };
const mutations = { /* ... */ };
const actions = { /* ... */ };
const getters = { /* ... */ };

// 2. 创建Store实例
const store = new Store({ state, mutations, actions, getters });

// 3. 导出实例供全局使用
export default store;
```

## 4. 注意事项
- Mutation必须是同步的，异步操作需通过Action处理。
- Getter应避免副作用，仅依赖当前状态。
- 订阅回调应避免复杂逻辑，防止性能问题。