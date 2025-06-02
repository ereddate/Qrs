import "./typeCheck.js";

class EventBus {
  constructor() {
    this.events = new Map();
  }

  // 监听事件
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(callback);
  }

  // 触发事件
  emit(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`EventBus error in ${eventName}:`, error);
        }
      });
    }
  }

  // 移除事件监听
  off(eventName, callback) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      if (callback) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      } else {
        this.events.delete(eventName);
      }
    }
  }

  // 一次性监听
  once(eventName, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(eventName, wrapper);
    };
    this.on(eventName, wrapper);
  }
}

// 导出单例实例
const eventBus = new EventBus();

const effectStack = [];
const queue = new Set();
let isFlushing = false;
const reactiveMap = new WeakMap();

function queueJob(job) {
  queue.add(job);
  if (!isFlushing) {
    isFlushing = true;
    Promise.resolve().then(flushJobs);
    // 在任务队列触发，DOM 可能更新后执行全局回调
    nextTick(() => {
      if (Function.is(window.globalAfterQueueJob)) {
        window.globalAfterQueueJob();
      }
    });
  }
}
let flushIndex = 0; // 新增执行索引
function flushJobs() {
  try {
    // 转换为数组并按优先级排序
    const jobs = Array.from(queue).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );
    for (flushIndex = 0; flushIndex < jobs.length; flushIndex++) {
      jobs[flushIndex]();
    }
  } finally {
    isFlushing = false;
    queue.clear();
    flushIndex = 0;
    // 在任务队列执行完成后执行回调
    nextTick(() => {
      // 这里可以添加全局的更新完成后的回调逻辑
      // 例如触发一个全局事件
      const globalUpdateEvent = new CustomEvent("globalUpdateCompleted");
      window.dispatchEvent(globalUpdateEvent);
    });
  }
}

// 自定义事件触发器
function createEventEmitter() {
  const listeners = {};
  return {
    on(event, callback) {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    },
    emit(event, ...args) {
      if (listeners[event]) {
        listeners[event].forEach((callback) => callback(...args));
      }
    },
  };
}

function reactive(obj, callback) {
  if (reactiveMap.has(obj)) {
    return reactiveMap.get(obj);
  }
  const deps = new Map();
  const eventEmitter = createEventEmitter();
  // 支持 Proxy 的环境
  const proxy = new Proxy(obj, {
    get(target, key) {
      if (effectStack.length > 0) {
        const activeEffect = effectStack[effectStack.length - 1];
        if (!deps.has(key)) {
          deps.set(key, new Set());
        }
        deps.get(key).add(activeEffect);
      }
      const value = target[key];
      //return Object.is(value) && value !== null ? reactive(value) : value;
      return value;
    },
    set(target, key, value) {
      if (target[key] === value) {
        return true;
      }
      const oldValue = target[key];
      target[key] = value;
      if (deps.has(key)) {
        deps.get(key).forEach((effect) => queueJob(effect));
      }
      if (Function.is(callback)) {
        nextTick(() => {
          callback(key, oldValue, value);
        });
      }
      return true;
    },
    deleteProperty(target, key) {
      if (key in target) {
        const oldValue = target[key];
        delete target[key];
        if (deps.has(key)) {
          deps.get(key).forEach((effect) => queueJob(effect));
        }
        if (Function.is(callback)) {
          nextTick(() => {
            callback(key, oldValue, undefined);
          });
        }
        eventEmitter.emit("delete", key, oldValue);
        return true;
      }
      return false;
    },
  });
  reactiveMap.set(obj, proxy);
  return proxy;
}

function computed(getter) {
  let value;
  let dirty = true;
  const computedDep = new Set();
  let lastGetter = getter;

  const effect = () => {
    if (!dirty) {
      dirty = true;
      // 触发 computed 属性自身的依赖更新
      computedDep.forEach((dep) => queueJob(dep));
      // 在 computed 属性更新，DOM 可能更新后执行回调
      nextTick(() => {
        if (Function.is(this.props?.afterComputedUpdate)) {
          this.props.afterComputedUpdate.call(this);
        }
      });
    }
  };

  const computedObj = {
    get() {
      if (dirty) {
        effectStack.push(effect);
        value = getter();
        effectStack.pop();
        dirty = false;
        lastGetter = getter;
      }
      if (effectStack.length > 0) {
        const activeEffect = effectStack[effectStack.length - 1];
        computedDep.add(activeEffect);
      }
      return value;
    },
  };

  return computedObj;
}

function watch(source, callback) {
  let getter;
  if (Function.is(source)) {
    getter = source;
  } else if (String.is(source)) {
    getter = () => {
      let obj = this.data;
      const keys = source.split(".");
      for (const key of keys) {
        if (obj && Object.is(obj)) {
          obj = obj[key];
        } else {
          return undefined;
        }
      }
      return obj;
    };
  } else {
    throw new Error("watch 的第一个参数必须是函数或字符串");
  }

  let oldValue = getter();
  const effect = () => {
    effectStack.push(effect);
    const newValue = getter();
    effectStack.pop();
    if (!Object.is(newValue, oldValue)) {
      callback(oldValue, newValue);
      oldValue = newValue;
      // 在数据变化，DOM 可能更新后执行回调
      nextTick(() => {
        if (Function.is(this.props?.afterWatchUpdate)) {
          this.props.afterWatchUpdate.call(this, oldValue, newValue);
        }
      });
    }
  };

  effectStack.push(effect);
  getter();
  effectStack.pop();
}

class Component {
  constructor(props) {
    const that = this;
    this.props?.beforeCreated?.call(this);
    this.props = props;
    // 新增：初始化 slots
    this.$slots = props.slots || {};
    this.data = reactive(
      Function.is(props.data) ? props.data.call(this) : props.data || {},
      function (key, oldValue, newValue) {
        that.update(key, oldValue, newValue);
      }
    );

    // 处理 computed 属性
    if (props.computed) {
      Object.keys(props.computed).forEach((key) => {
        const computedValue = computed.bind(this)(
          props.computed[key].bind(this)
        );
        Object.defineProperty(this.data, key, {
          get: computedValue.get,
        });
      });
    }

    // 处理 watch
    if (props.watch) {
      Object.keys(props.watch).forEach((key) => {
        const callback = props.watch[key].bind(this);
        // 绑定正确的 this 上下文
        watch.bind(this)(this.data[key], callback);
      });
    }

    this.el = null;
    this.props?.created?.call(this);

    // 在组件初始化完成，首次渲染后执行回调
    nextTick(() => {
      if (Function.is(this.props?.afterComponentInit)) {
        this.props.afterComponentInit.call(this);
      }
    });
    return this;
  }

  render() {
    this.props?.beforeMount?.call(this);
    const el = this.props?.render.bind(this)(this.$slots);
    this.props?.mounted?.call(this);
    // 在组件挂载完成，DOM 渲染后执行回调
    nextTick(() => {
      if (Function.is(this.props?.afterMount)) {
        this.props.afterMount.call(this);
      }
    });
    return el;
  }
  update() {
    // 添加防抖逻辑
    if (this._pendingUpdate) return;
    this._pendingUpdate = true;

    nextTick(() => {
      this._pendingUpdate = false;
      this.props?.beforeUpdate?.call(this);
      // 使用requestAnimationFrame优化DOM更新
      requestAnimationFrame(() => {
        const newEl = this.render();
        // 比较新旧 DOM 节点，若相同则不更新
        if (this.el && this.el.isEqualNode(newEl)) {
          return;
        }

        if (this.el?.parentNode) {
          this.el.parentNode.replaceChild(newEl, this.el);
        } else {
          this.el?.replaceWith(newEl);
        }
        this.el = newEl;
        this.props?.updated?.call(this);
      });
    });
    // 在 DOM 更新完成后执行回调
    nextTick(() => {
      if (Function.is(this.props?.afterUpdate)) {
        this.props.afterUpdate.call(this);
      }
    });
  }
  unmount() {
    this.props?.beforeUnmount?.call(this);
    this.el?.remove();
    this.el = null;
    this.props = null;
    this.props?.unmounted?.call(this);
    // 在组件卸载完成，DOM 移除后执行回调
    nextTick(() => {
      if (Function.is(this.props?.afterUnmount)) {
        this.props.afterUnmount.call(this);
      }
    });
  }
  $emit(eventName, ...args) {
    const listeners = this.props?.on?.[eventName];
    if (listeners) {
      if (Array.isArray(listeners)) {
        listeners.forEach((listener) => listener.apply(this, args));
      } else {
        listeners.apply(this, args);
      }
    }
  }
}

const isComponent = function (obj) {
  return obj instanceof Component;
};

const isVNode = function (obj) {
  return obj instanceof VNode;
};

const updateProps = function (elem, props) {
  const styleObj = {};
  Object.keys(props).forEach((key) => {
    const currentValue = key === "style" ? elem.style.cssText : elem[key];
    const newValue = props[key];
    // 若值相同则不更新
    if (currentValue === newValue) {
      return;
    }
    switch (key) {
      case "style":
        Object.assign(styleObj, props[key]);
        break;
      case "class":
        elem.className = props[key];
        break;
      case "html":
        elem.innerHTML = props[key];
        break;
      case "show":
        if (props[key]) {
          elem.style.display = "block";
        } else {
          elem.style.display = "none";
        }
        break;
      case "text":
        elem.appendChild(document.createTextNode(props[key]));
        break;
      case "on":
        Object.keys(props[key]).forEach((event) => {
          elem.addEventListener(event, function () {
            props[key][event].call(props, ...arguments);
          });
        });
        break;
      default:
        elem.setAttribute(key, props[key]);
        break;
    }
  });
  // 一次性更新样式
  if (Object.keys(styleObj).length > 0) {
    Object.assign(elem.style, styleObj);
  }
  // 在属性更新完成，DOM 渲染后执行回调
  nextTick(() => {
    if (Function.is(elem.props?.afterPropsUpdate)) {
      elem.props.afterPropsUpdate.call(elem);
    }
  });
};

const updateChildren = function (elem, children) {
  children.forEach((child) => {
    if (isComponent(child) || isVNode(child)) {
      const newComponent = new child.constructor(child.props);
      const el = newComponent.render();
      newComponent.el = el;
      elem.appendChild(el);
    } else if (String.is(child)) {
      if (/<[a-z][\s\S]*>/i.test(child)) {
        // 识别HTML字符串并转换为DOM节点
        const template = document.createElement("template");
        template.innerHTML = child.trim();
        const nodes = template.content.childNodes;
        updateChildren.bind(this)(elem, Array.from(nodes));
      } else {
        elem.appendChild(document.createTextNode(child));
      }
    } else if (Array.is(child)) {
      updateChildren.bind(this)(elem, child);
    } else if (isTransition(child)) {
      const transitionEl = child.render();
      updateChildren.bind(this)(elem, transitionEl);
      nextTick(() => {
        child.triggerTransition();
      });
    } else if (child instanceof Node) {
      // 添加 Node 类型检查
      elem.appendChild(child);
    } else if (
      typeof child !== "undefined" ||
      child !== false ||
      child !== null
    ) {
      child && updateChildren.bind(this)(elem, [child.toString()]);
    }
  });
  // 在子节点更新完成，DOM 渲染后执行回调
  nextTick(() => {
    if (Function.is(elem.props?.afterChildrenUpdate)) {
      elem.props.afterChildrenUpdate.call(elem);
    }
  });
};

class VNode {
  constructor(tag, props, children) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.el = null;
    return this;
  }

  render() {
    const that = this;

    // 添加缓存机制
    if (this._cachedEl) return this._cachedEl;
    if (isComponent(this.tag) || isVNode(this.tag)) {
      // 修正递归逻辑
      const newInstance = new this.tag.constructor(this.props);
      const el = newInstance.render();
      this.el = el;
      return el;
    }
    const elem =
      this.tag === "text"
        ? document.createTextNode("")
        : document.createElement(this.tag);
    if (this.props) {
      updateProps.bind(this)(elem, this.props);
    }
    if (this.children) {
      updateChildren.bind(this)(elem, this.children);
    }
    this._cachedEl = elem; // 缓存结果
    return elem;
  }

  // 添加shouldUpdate方法
  shouldUpdate(newVNode) {
    if (this.tag !== newVNode.tag) return true;
    if (JSON.stringify(this.props) !== JSON.stringify(newVNode.props))
      return true;
    if (JSON.stringify(this.children) !== JSON.stringify(newVNode.children))
      return true;
    return false;
  }
}

const createElem = (tag, props, ...children) => {
  if (isComponent(tag)) {
    const slots = [];
    slots.default = children;
    const newComponent = new tag.constructor({ ...tag.props, ...props, slots });
    const elem = newComponent.render();
    newComponent.el = elem;
    return elem;
  }
  const vnode = new VNode(tag, props, children);
  const elem = vnode.render();
  return elem;
};

function query(selector) {
  return document.querySelector(selector);
}

function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      rootContainer = query(rootContainer);
      const rootEl = rootComponent.render();
      rootComponent.el = rootEl;
      rootContainer.appendChild(rootEl);
      // 在应用挂载完成，DOM 渲染后执行回调
      nextTick(() => {
        if (Function.is(rootComponent.props?.afterAppMount)) {
          rootComponent.props.afterAppMount.call(rootComponent);
        }
      });
    },
  };
}

// 定义 nextTick 函数
const nextTick = (() => {
  const callbacks = [];
  let pending = false;

  function flushCallbacks() {
    pending = false;
    const copies = callbacks.slice();
    callbacks.length = 0;
    for (let i = 0; i < copies.length; i++) {
      copies[i]();
    }
  }

  // 优先使用MutationObserver
  let timerFunc;
  if (typeof MutationObserver !== "undefined") {
    let counter = 1;
    const observer = new MutationObserver(flushCallbacks);
    const textNode = document.createTextNode(String(counter));
    observer.observe(textNode, { characterData: true });
    timerFunc = () => {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
  } else {
    timerFunc = () => Promise.resolve().then(flushCallbacks);
  }

  return function (cb) {
    if (Function.is(cb)) {
      callbacks.push(cb);
      if (!pending) {
        pending = true;
        timerFunc();
      }
    } else {
      return new Promise((resolve) => {
        callbacks.push(resolve);
        if (!pending) {
          pending = true;
          timerFunc();
        }
      });
    }
  };
})();

// 服务端渲染相关函数
function vnodeToHtml(vnode) {
  if (String.is(vnode) || Number.is(vnode)) {
    return vnode.toString();
  }
  if (!vnode.tag) {
    return "";
  }

  const attrs = Object.entries(vnode.props || {})
    .map(([key, value]) => ` ${key}="${value}"`)
    .join("");

  const childrenHtml = (vnode.children || [])
    .map((child) => vnodeToHtml(child))
    .join("");

  return `<${vnode.tag}${attrs}>${childrenHtml}</${vnode.tag}>`;
}

async function prefetchData(app) {
  if (app.prefetch) {
    return await app.prefetch();
  }
  return {};
}

function injectState(initialState) {
  return `<script>window.__INITIAL_STATE__ = ${JSON.stringify(
    initialState
  )};</script>`;
}

class Transition {
  constructor(props) {
    this.props = props;
    this.el = null;
    this.children = null;
  }

  beforeEnter(el) {
    if (!el) return;
    this.props?.onBeforeEnter?.(el);
    this.addTransitionClass(el, "enter-from");
  }

  enter(el) {
    if (!el) return;
    this.removeTransitionClass(el, "enter-from");
    this.addTransitionClass(el, "enter-to");
    this.props?.onEnter?.(el, () => this.afterEnter(el));
  }

  afterEnter(el) {
    if (!el) return;
    this.removeTransitionClass(el, "enter-to");
    this.removeTransitionClass(el, "enter-active");
    this.props?.onAfterEnter?.(el);
  }

  beforeLeave(el) {
    if (!el) return;
    this.props?.onBeforeLeave?.(el);
    this.addTransitionClass(el, "leave-from");
  }

  leave(el) {
    if (!el) return;
    this.removeTransitionClass(el, "leave-from");
    this.addTransitionClass(el, "leave-to");
    this.props?.onLeave?.(el, () => this.afterLeave(el));
  }

  afterLeave(el) {
    if (!el) return;
    this.removeTransitionClass(el, "leave-to");
    this.removeTransitionClass(el, "leave-active");
    this.props?.onAfterLeave?.(el);
  }

  addTransitionClass(el, className) {
    el.classList.add(className);
    this.props?.css && el.classList.add(`${className}-active`);
  }

  removeTransitionClass(el, className) {
    el.classList.remove(className);
    this.props?.css && el.classList.remove(`${className}-active`);
  }

  render() {
    const { show, mode = "in-out" } = this.props;
    const children = this.props.children;

    if (!children) return null;

    if (Array.isArray(children)) {
      // 处理多个子元素的情况
      return children.map((child) => this.renderChild(child, show));
    }

    return this.renderChild(children, show);
  }

  renderChild(child, show) {
    if (!child) return null;

    if (isComponent(child) || isVNode(child)) {
      const instance = new child.constructor(child.props);
      const el = instance.render();
      instance.el = el;
      this.el = el;

      return el;
    } else {
      this.el = child;
      return child;
    }
  }
  triggerTransition() {
    if (this.props.show) {
      this.beforeEnter(this.el);
      nextTick(() => {
        this.enter(this.el);
      });
    } else {
      this.beforeLeave(this.el);
      nextTick(() => {
        this.leave(this.el);
      });
    }
  }
}

const isTransition = function (obj) {
  return obj instanceof Transition;
};

const extend = function (target, source) {
  return Object.assign(target, ...sources);
};

const name = "qrs";

export {
  name,
  reactive,
  createElem,
  Component,
  isComponent,
  createApp,
  VNode,
  isVNode,
  query,
  nextTick,
  eventBus,
  vnodeToHtml,
  prefetchData,
  injectState,
  Transition,
  isTransition,
  extend,
};
