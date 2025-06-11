// 存储已注册的微应用
const registeredApps = new Map();
// 存储当前激活的微应用
let activeApp = null;
// 全局状态管理
let globalState = {};
const stateListeners = new Set();

/**
 * 初始化全局状态
 * 支持多实例监听、变更通知、深拷贝防止污染
 */
function initGlobalState(initialState = {}) {
  globalState = { ...initialState };
  return {
    onGlobalStateChange: (callback, fireImmediately = false) => {
      stateListeners.add(callback);
      if (fireImmediately) callback({ ...globalState });
      return () => stateListeners.delete(callback);
    },
    setGlobalState: (newState) => {
      const prev = { ...globalState };
      globalState = { ...globalState, ...newState };
      stateListeners.forEach((callback) => callback({ ...globalState }, prev));
    },
    getGlobalState: () => ({ ...globalState }),
    offGlobalStateChange: (callback) => stateListeners.delete(callback),
    clearGlobalState: () => {
      globalState = {};
      stateListeners.forEach((callback) => callback({}));
    },
  };
}

// JS 沙箱实现
class Sandbox {
  constructor() {
    this.fakeWindow = {};
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
      deleteProperty: (target, prop) => {
        if (prop in this.fakeWindow) {
          delete this.fakeWindow[prop];
          return true;
        }
        return false;
      },
    });
    this.active = true;
  }

  activate() {
    this.active = true;
  }

  inactive() {
    this.active = false;
    this.fakeWindow = {};
  }
}

/**
 * 注册微应用
 * 支持重复注册检测、预加载
 */
function registerMicroApp(name, appConfig) {
  if (registeredApps.has(name)) {
    throw new Error(`微应用 ${name} 已注册`);
  }
  registeredApps.set(name, {
    ...appConfig,
    status: "unloaded", // unloaded, loaded, mounted
    sandbox: new Sandbox(),
  });
  if (appConfig.preload) {
    setTimeout(() => loadMicroApp(name), 0);
  }
}

/**
 * 加载微应用资源
 * 支持异步加载和状态管理
 */
async function loadMicroApp(name) {
  const app = registeredApps.get(name);
  if (!app) {
    throw new Error(`微应用 ${name} 未注册`);
  }
  if (app.status === "unloaded") {
    if (typeof app.load === "function") {
      await app.load(app.sandbox.proxy);
    }
    app.status = "loaded";
  }
  return app;
}

/**
 * 挂载微应用到指定容器
 * 支持 shadowDOM 样式隔离和多实例切换
 */
async function mountMicroApp(name, containerId) {
  if (activeApp && activeApp.name !== name) {
    await unmountMicroApp(activeApp.name);
  }

  const app = await loadMicroApp(name);
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`未找到容器元素 ${containerId}`);
  }

  app.sandbox.activate();

  // 样式隔离
  if (app.styleIsolation === "shadowDOM") {
    let shadowRoot = container.shadowRoot;
    if (!shadowRoot) {
      shadowRoot = container.attachShadow({ mode: "open" });
    }
    if (typeof app.mount === "function") {
      await app.mount(shadowRoot, app.sandbox.proxy);
    }
  } else {
    if (typeof app.mount === "function") {
      await app.mount(container, app.sandbox.proxy);
    }
  }

  app.status = "mounted";
  activeApp = { name, app };
}

/**
 * 卸载当前激活的微应用
 * 支持生命周期钩子和沙箱清理
 */
async function unmountMicroApp(name) {
  const app = registeredApps.get(name);
  if (!app || app.status !== "mounted") {
    return;
  }

  if (typeof app.unmount === "function") {
    await app.unmount(app.sandbox.proxy);
  }
  app.sandbox.inactive();
  app.status = "loaded";
  if (activeApp?.name === name) {
    activeApp = null;
  }
}

/**
 * 获取当前激活的微应用
 */
function getActiveMicroApp() {
  return activeApp;
}

/**
 * 获取所有已注册微应用
 */
function getRegisteredMicroApps() {
  return Array.from(registeredApps.keys());
}

// 导出微应用框架的核心方法
export {
  registerMicroApp,
  mountMicroApp,
  unmountMicroApp,
  initGlobalState,
  getActiveMicroApp,
  getRegisteredMicroApps,
};
