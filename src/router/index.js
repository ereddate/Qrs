import { Component, createElem } from "@/core/index.js";
import { Router } from "@/core/router.js";
import Home from "../views/Home.js";
import About from "../views/About.js";
// 定义路由配置，包含 404 路由
const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
  {
    path: "*",
    component: new Component({
      render() {
        return createElem("div", {}, "404 Not Found");
      },
    }),
  },
];

// 创建路由实例
const router = new Router({ routes });

// 添加全局前置守卫
router.beforeEach((from, to) => {
  console.log(`Navigating from ${from?.path || "null"} to ${to?.path}`);
  // 可以返回 false 取消导航，或返回新的路径进行重定向
  return true;
});

// 添加全局后置钩子
router.afterEach((from, to) => {
  console.log(`Navigated from ${from?.path || "null"} to ${to?.path}`);
});

export default router;
