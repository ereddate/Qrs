// 存储已注册的微应用
const registeredApps = new Map();
// 存储当前激活的微应用
let activeApp = null;
// 全局状态管理
let globalState = {};
const stateListeners = new Set();

// 初始化全局状态
function initGlobalState(initialState) {
  globalState = { ...initialState };
  return {
    onGlobalStateChange: (callback) => {
      stateListeners.add(callback);
      return () => stateListeners.delete(callback);
    },
    setGlobalState: (newState) => {
      globalState = { ...globalState, ...newState };
      stateListeners.forEach((callback) => callback(globalState));
    },
  };
}

// JS 沙箱实现
class Sandbox {
  constructor() {
    this.proxy = new Proxy(window, {
      has: (target, prop) => prop in this.fakeWindow || prop in target,
      get: (target, prop) => {
        if (prop in this.fakeWindow) {
          return this.fakeWindow[prop];
        }
        return target[prop];
      },
      set: (target, prop, value) => {
        this.fakeWindow[prop] = value;
        return true;
      },
    });
    this.fakeWindow = {};
  }

  active() {
    // 激活沙箱
  }

  inactive() {
    // 失活沙箱
    this.fakeWindow = {};
  }
}

// 注册微应用
function registerMicroApp(name, appConfig) {
  registeredApps.set(name, {
    ...appConfig,
    status: "unloaded", // 微应用状态：unloaded, loaded, mounted
    sandbox: new Sandbox(),
  });
  if (appConfig.preload) {
    // 资源预加载
    setTimeout(() => loadMicroApp(name), 0);
  }
}

// 加载微应用资源
async function loadMicroApp(name) {
  const app = registeredApps.get(name);
  if (!app) {
    throw new Error(`微应用 ${name} 未注册`);
  }

  if (app.status === "unloaded") {
    if (app.load) {
      await app.load(app.sandbox.proxy);
    }
    app.status = "loaded";
  }
  return app;
}

// 挂载微应用到指定容器
async function mountMicroApp(name, containerId) {
  if (activeApp) {
    await unmountMicroApp(activeApp.name);
  }

  const app = await loadMicroApp(name);
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`未找到容器元素 ${containerId}`);
  }

  app.sandbox.active();

  // 样式隔离
  const styleIsolation = app.styleIsolation;
  if (styleIsolation === "shadowDOM") {
    const shadowRoot = container.attachShadow({ mode: "open" });
    if (app.mount) {
      await app.mount(shadowRoot, app.sandbox.proxy);
    }
  } else {
    if (app.mount) {
      await app.mount(container, app.sandbox.proxy);
    }
  }

  app.status = "mounted";
  activeApp = { name, app };
}

// 卸载当前激活的微应用
async function unmountMicroApp(name) {
  const app = registeredApps.get(name);
  if (!app || app.status !== "mounted") {
    return;
  }

  if (app.unmount) {
    await app.unmount(app.sandbox.proxy);
  }
  app.sandbox.inactive();
  app.status = "loaded";
  if (activeApp?.name === name) {
    activeApp = null;
  }
}

// 导出微应用框架的核心方法
export { registerMicroApp, mountMicroApp, unmountMicroApp, initGlobalState };
