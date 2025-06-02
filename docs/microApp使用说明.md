# 微应用框架使用说明

## 一、概述
本框架提供微前端核心能力，支持微应用的注册、加载、挂载、卸载全生命周期管理，并包含全局状态管理和JS沙箱机制，实现主应用与子应用的隔离。

## 二、核心API说明

### 1. registerMicroApp(name, appConfig)
- **功能**：注册微应用
- **参数**：
  - `name`：微应用名称（唯一标识）
  - `appConfig`：微应用配置对象，支持以下字段：
    - `preload`：布尔值，是否预加载资源
    - `styleIsolation`：样式隔离模式（可选值：'shadowDOM'）
    - `load`：资源加载函数（接收沙箱代理window）
    - `mount`：挂载函数（接收容器元素和沙箱代理window）
    - `unmount`：卸载函数（接收沙箱代理window）
- **示例**：
  ```javascript
  registerMicroApp("subApp", {
    preload: true,
    styleIsolation: "shadowDOM",
    load: async (proxyWindow) => await import("./subApp.js"),
    mount: (container) => container.innerHTML = "<h2>子应用已挂载</h2>"
  });
  ```

### 2. mountMicroApp(name, containerId)
- **功能**：挂载指定微应用到容器
- **参数**：
  - `name`：已注册的微应用名称
  - `containerId`：挂载容器的DOM元素ID
- **行为**：自动卸载当前激活的微应用，加载目标应用资源并挂载到指定容器
- **注意**：容器元素需提前存在

### 3. unmountMicroApp(name)
- **功能**：卸载指定微应用
- **参数**：`name`：已挂载的微应用名称
- **行为**：执行卸载逻辑，失活沙箱，更新应用状态

### 4. initGlobalState(initialState)
- **功能**：初始化全局状态管理
- **参数**：`initialState`：初始状态对象
- **返回**：
  - `onGlobalStateChange(callback)`：注册状态变化监听器（返回取消监听函数）
  - `setGlobalState(newState)`：更新全局状态（合并式更新）
- **示例**：
  ```javascript
  const { onGlobalStateChange, setGlobalState } = initGlobalState({ theme: "light" });
  onGlobalStateChange((state) => console.log("状态更新", state));
  setGlobalState({ theme: "dark" });
  ```

## 三、关键机制说明

### 1. JS沙箱
通过`Proxy`实现运行时隔离，每个微应用拥有独立的`fakeWindow`对象。激活沙箱时使用代理window，失活时清空`fakeWindow`，防止污染主应用全局空间。

### 2. 样式隔离
支持`shadowDOM`模式，通过`attachShadow`创建独立的样式作用域，避免子应用样式与主应用/其他子应用冲突。

## 四、完整示例
### 主应用（index.js）
```javascript
import { registerMicroApp, mountMicroApp, initGlobalState } from "./core/microApp.js";

// 初始化全局状态
const { setGlobalState } = initGlobalState({ theme: "light" });

// 注册微应用
registerMicroApp("subApp", {
  preload: true,
  styleIsolation: "shadowDOM",
  load: async () => await import("./subApp.js"),
  mount: (container) => container.innerHTML = "<h2>子应用已挂载</h2>"
});

// 触发挂载
mountMicroApp("subApp", "micro-app-container");
```

### 子应用（subApp.js）
```javascript
// 导出挂载/卸载逻辑
export async function mount(container) {
  container.innerHTML = `<h2>当前主题: ${globalState.theme}</h2>`;
}

export async function unmount() {
  console.log("子应用已卸载");
}
```

## 五、注意事项
1. 微应用需通过`registerMicroApp`注册后才能挂载
2. 样式隔离仅在设置`styleIsolation: "shadowDOM"`时生效
3. 全局状态更新会触发所有监听器回调，注意避免性能问题
4. 沙箱失活后，子应用对window的修改不会保留