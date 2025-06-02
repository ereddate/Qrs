import {
  registerMicroApp,
  mountMicroApp,
  unmountMicroApp,
  initGlobalState,
} from "./microApp.js";

// 初始化全局状态
const { onGlobalStateChange, setGlobalState } = initGlobalState({
  theme: "light",
});

// 监听全局状态变化
onGlobalStateChange((state) => {
  console.log("全局状态更新:", state);
});

// 注册微应用
registerMicroApp("subApp", {
  preload: true,
  styleIsolation: "shadowDOM",
  load: async (proxyWindow) => {
    // 动态加载子应用模块
    await import("./subApp.js");
  },
  mount: async (container, proxyWindow) => {
    // 子应用挂载逻辑
    container.innerHTML = "<h2>子应用已挂载</h2>";
  },
  unmount: async (proxyWindow) => {
    // 子应用卸载逻辑
    console.log("子应用已卸载");
  },
});

// 挂载子应用函数
async function mountSubApp() {
  try {
    await mountMicroApp("subApp", "micro-app-container");
    console.log("子应用已成功挂载");
  } catch (error) {
    console.error("挂载子应用时出错:", error);
  }
}

// 卸载子应用函数
async function unmountSubApp() {
  try {
    await unmountMicroApp("subApp");
    console.log("子应用已成功卸载");
  } catch (error) {
    console.error("卸载子应用时出错:", error);
  }
}

// 绑定按钮点击事件
document.getElementById("mount-btn").addEventListener("click", mountSubApp);
document.getElementById("unmount-btn").addEventListener("click", unmountSubApp);

// 主应用更新全局状态
setGlobalState({ theme: "dark" });
