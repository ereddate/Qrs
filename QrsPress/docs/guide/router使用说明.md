# core/router.js 使用说明

## 一、核心功能概述
本路由模块支持以下核心功能：
- **路由模式**：支持`hash`（默认）和`history`模式，通过构造参数`mode`配置
- **守卫机制**：包含全局前置守卫（`beforeEach`）和全局后置钩子（`afterEach`）
- **导航方法**：提供`push`（新增历史记录）和`replace`（替换当前记录）两种编程式导航
- **路由匹配**：支持精确路径匹配，未匹配时自动跳转到`*`定义的404路由
- **过渡动画**：通过`RouterView`组件支持路由切换的进入/离开动画（`route-enter`/`route-leave`类名）
- **懒加载**：提供静态方法`Router.lazyLoad`实现组件懒加载

## 二、基础使用步骤
### 1. 路由配置（示例参考src/router/index.js）
```javascript
import { Router } from "@/core/router.js";
import Home from "../views/Home.js";
import About from "../views/About.js";

const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
  { // 404路由
    path: "*",
    component: new Component({ render: () => createElem("div", {}, "404 Not Found") })
  }
];

// 创建路由实例（可选配置mode: 'history'）
const router = new Router({ routes, mode: "hash" });
```

### 2. 守卫配置
```javascript
// 全局前置守卫（可返回false取消导航/返回路径重定向）
router.beforeEach((from, to) => {
  console.log(`导航从 ${from?.path} 到 ${to.path}`);
  return true; // 允许导航
});

// 全局后置钩子（导航完成后执行）
router.afterEach((from, to) => {
  console.log(`已导航至 ${to.path}`);
});
```

## 三、核心组件使用
### 1. RouterView（路由视图容器）
在根组件中添加`RouterView`以显示当前匹配的路由组件：
```javascript
const App = new Component({ render: () => createElem(RouterView, { router }) });
```
**动画支持**：
- 离开动画：匹配新路由时，旧组件会添加`route-leave`类
- 进入动画：新组件加载后会添加`route-enter`类（300ms后自动移除）

### 2. RouterLink（路由链接）
```javascript
// 在模板中使用（支持replace属性）
createElem(RouterLink, { to: "/about", replace: false }, "关于页面");
```
自动生成对应`href`（hash模式带`#`前缀），点击时触发导航逻辑

## 四、编程式导航
```javascript
// 跳转到新路径（新增历史记录）
router.push("/about");

// 替换当前路径（不新增历史记录）
router.replace("/about");
```

## 五、路由懒加载
```javascript
{ // 懒加载组件示例
  path: "/lazy",
  component: Router.lazyLoad(() => import("../views/LazyPage.js"))
}
```