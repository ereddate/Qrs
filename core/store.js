import { reactive } from "./index.js";

// 递归安装模块
function installModule(store, rootState, path, module) {
  const isRoot = path.length === 0;
  const namespace = store._modules.getNamespace(path);

  // 注册模块状态
  if (!isRoot) {
    const parentState = path
      .slice(0, -1)
      .reduce((state, key) => state[key], rootState);
    parentState[path[path.length - 1]] = reactive(module.state || {});
  }

  // 注册 mutations
  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key;
    store._mutations[namespacedType] = store._mutations[namespacedType] || [];
    store._mutations[namespacedType].push((payload) => {
      mutation.call(store, module.state, payload);
      store._notifySubscribers(namespacedType, payload);
    });
  });

  // 注册 actions
  module.forEachAction((action, key) => {
    const namespacedType = namespace + key;
    store._actions[namespacedType] = store._actions[namespacedType] || [];
    store._actions[namespacedType].push((payload) => {
      const context = {
        state: module.state,
        rootState: store.state,
        commit: store.commit.bind(store),
        dispatch: store.dispatch.bind(store),
        getters: store.getters,
        namespace,
        module,
      };
      return action.call(store, context, payload);
    });
  });

  // 注册 getters
  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key;
    if (store._wrappedGetters[namespacedType]) {
      console.warn(`Getter "${namespacedType}" has already been defined`);
      return;
    }
    store._wrappedGetters[namespacedType] = () =>
      getter(module.state, store.getters, rootState);
  });

  // 递归安装子模块
  module.forEachChild((childModule, key) => {
    installModule(store, rootState, path.concat(key), childModule);
  });
}

// 重置 store 的内部状态
function resetStoreState(store, state) {
  store._state = reactive({ data: state }, () => store._notifySubscribers());
  store.state = store._state.data;
}

// 模块构造函数
class Module {
  constructor(rawModule) {
    this._rawModule = rawModule;
    this._children = {};
    this.state = rawModule.state || {};
  }

  get namespaced() {
    return !!this._rawModule.namespaced;
  }

  addChild(key, module) {
    this._children[key] = module;
  }

  removeChild(key) {
    delete this._children[key];
  }

  getChild(key) {
    return this._children[key];
  }

  forEachChild(fn) {
    Object.keys(this._children).forEach((key) => fn(this._children[key], key));
  }

  forEachMutation(fn) {
    if (this._rawModule.mutations) {
      Object.keys(this._rawModule.mutations).forEach((key) =>
        fn(this._rawModule.mutations[key], key)
      );
    }
  }

  forEachAction(fn) {
    if (this._rawModule.actions) {
      Object.keys(this._rawModule.actions).forEach((key) =>
        fn(this._rawModule.actions[key], key)
      );
    }
  }

  forEachGetter(fn) {
    if (this._rawModule.getters) {
      Object.keys(this._rawModule.getters).forEach((key) =>
        fn(this._rawModule.getters[key], key)
      );
    }
  }
}

// 模块集合类
class ModuleCollection {
  constructor(rawRootModule) {
    this.register([], rawRootModule);
  }

  get(path) {
    return path.reduce((module, key) => {
      return module.getChild(key);
    }, this.root);
  }

  getNamespace(path) {
    let module = this.root;
    return path.reduce((namespace, key) => {
      module = module.getChild(key);
      return namespace + (module.namespaced ? key + "/" : "");
    }, "");
  }

  register(path, rawModule) {
    const newModule = new Module(rawModule);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      const parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }

    if (rawModule.modules) {
      Object.keys(rawModule.modules).forEach((childKey) => {
        const childRawModule = rawModule.modules[childKey];
        this.register(path.concat(childKey), childRawModule);
      });
    }
  }
}

class Store {
  constructor(options = {}) {
    this._modules = new ModuleCollection(options);
    this._mutations = Object.create(null);
    this._actions = Object.create(null);
    this._wrappedGetters = Object.create(null);
    this._subscribers = [];
    this._actionSubscribers = [];
    this._plugins = options.plugins || [];

    // 初始化状态
    const state = this._modules.root.state;
    installModule(this, state, [], this._modules.root);
    resetStoreState(this, state);

    // 应用插件
    this._plugins.forEach((plugin) => plugin(this));
  }

  // 提交 mutation 来修改状态
  commit(mutationName, payload) {
    const entry = this._mutations[mutationName];
    if (!entry) {
      console.warn(`Mutation ${mutationName} not found`);
      return;
    }
    entry.forEach((handler) => handler(payload));
  }

  // 分发 action，支持 action 订阅
  dispatch(actionName, payload) {
    const entry = this._actions[actionName];
    if (!entry) {
      console.warn(`Action ${actionName} not found`);
      return Promise.resolve([]);
    }
    // action 订阅前置钩子
    this._actionSubscribers.forEach((sub) => {
      if (typeof sub.before === "function")
        sub.before(actionName, payload, this);
    });
    const results = entry.map((handler) => handler(payload));
    // action 订阅后置钩子
    Promise.all(results).then((res) => {
      this._actionSubscribers.forEach((sub) => {
        if (typeof sub.after === "function")
          sub.after(actionName, payload, this, res);
      });
    });
    return Promise.all(results);
  }

  // 获取 getter
  get getters() {
    const getters = {};
    Object.keys(this._wrappedGetters).forEach((key) => {
      Object.defineProperty(getters, key, {
        get: () => this._wrappedGetters[key](),
        enumerable: true,
      });
    });
    return getters;
  }

  // 订阅状态变化
  subscribe(callback) {
    if (typeof callback === "function") {
      this._subscribers.push(callback);
    }
    // 返回取消订阅函数
    return () => {
      const idx = this._subscribers.indexOf(callback);
      if (idx > -1) this._subscribers.splice(idx, 1);
    };
  }

  // 订阅 action 执行（增强功能）
  subscribeAction(subscriber) {
    if (
      subscriber &&
      (typeof subscriber === "function" ||
        (typeof subscriber === "object" &&
          (typeof subscriber.before === "function" ||
            typeof subscriber.after === "function")))
    ) {
      this._actionSubscribers.push(subscriber);
    }
    // 返回取消订阅函数
    return () => {
      const idx = this._actionSubscribers.indexOf(subscriber);
      if (idx > -1) this._actionSubscribers.splice(idx, 1);
    };
  }

  // 通知订阅者状态变化，支持传递 mutation 名和 payload
  _notifySubscribers(mutation, payload) {
    const snapshot = this.state;
    this._subscribers.forEach((callback) =>
      callback(snapshot, mutation, payload)
    );
  }

  // 动态注册模块
  registerModule(path, rawModule) {
    if (typeof path === "string") path = [path];
    this._modules.register(path, rawModule);
    installModule(this, this.state, path, this._modules.get(path));
    resetStoreState(this, this.state);
  }

  // 动态卸载模块
  unregisterModule(path) {
    if (typeof path === "string") path = [path];
    const parent = this._modules.get(path.slice(0, -1));
    if (parent) {
      parent.removeChild(path[path.length - 1]);
      resetStoreState(this, this.state);
    }
  }

  // 热重载支持
  hotUpdate(newOptions) {
    this._modules.register([], newOptions);
    installModule(this, this.state, [], this._modules.root);
    resetStoreState(this, this.state);
  }
}

export default Store;
