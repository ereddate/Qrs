import { initGlobalState } from "./microApp.js";

// 获取全局状态管理方法
const { onGlobalStateChange, setGlobalState } = initGlobalState();

// 监听全局状态变化
onGlobalStateChange((state) => {
  console.log("子应用接收到全局状态变化:", state);
  const container = document.querySelector("h2");
  if (container) {
    container.textContent = `当前主题: ${state.theme}`;
  }
});

// 导出 mount 方法
export async function mount(container, proxyWindow) {
  // 子应用更新全局状态
  setGlobalState({ subAppStatus: "mounted" });
  container.innerHTML = `
        <h2>子应用已挂载，当前主题: ${globalState.theme}</h2>
        <button id="update-state-btn">更新全局状态</button>
    `;

  // 子应用内按钮点击事件
  container.querySelector("#update-state-btn").addEventListener("click", () => {
    setGlobalState({ message: "来自子应用的消息" });
  });
}

// 导出 unmount 方法
export async function unmount(proxyWindow) {
  // 子应用卸载时更新全局状态
  setGlobalState({ subAppStatus: "unmounted" });
  console.log("子应用正在卸载");
}
