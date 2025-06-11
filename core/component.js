import { reactive, computed, watch, ref, isRef, toRefs } from "./reactive.js";
import { nextTick } from "./queue.js";
import compileTemplate from "./templateCompiler.js";
import { createVnode, isVNode } from "./vnode.js";

// 定义全局的事件总线
const eventBus = new EventTarget();

// 工具函数：类型判断
const isFunction = (val) => typeof val === "function";

// 组件类
class Component {
  constructor(props = {}, document = window.document) {
    // 类型检查
    if (typeof props !== "object" || props === null) {
      throw new TypeError("Props must be an object");
    }

    props?.beforeCreated?.call(this);

    // 合并默认值
    this.props = {
      ...props,
      data: props.data || (() => ({})),
      computed: props.computed || {},
      watch: props.watch || {},
    };

    const { template, parent } = this.props;

    // 初始化 slots
    this.$slots = this._initSlots();
    this.$scopedSlots = this._initScopedSlots();

    this.data = this._initData();
    this.document = document;
    this.parent = parent || null;

    this.provided = this._initProvide();
    this._handleInject(this.props.inject);

    this._initSetup();
    this._initComputed();
    this._initWatch();

    if (template) {
      this.initTemplate(template);
    }

    this.el = null;
    this._events = {};
    this._exposed = {};
    this._pendingUpdate = false;

    this.props?.created?.call(this);

    nextTick(() => {
      this.props?.afterComponentInit?.call(this);
    });
  }

  _initSlots() {
    const slots = Object.create(null);
    const rawSlots = this.props.slots?.default || [];

    rawSlots.forEach((child) => {
      const slotName = child?.props?.slot || "default";
      (slots[slotName] || (slots[slotName] = [])).push(child);
    });

    return slots;
  }

  _initScopedSlots() {
    const scopedSlots = {};
    Object.entries(this.$slots).forEach(([name, slotContent]) => {
      scopedSlots[name] = (scope) => {
        return slotContent.map((child) => {
          return isFunction(child) ? child(scope) : child;
        });
      };
    });
    return scopedSlots;
  }

  _initData() {
    const data = isFunction(this.props.data)
      ? this.props.data.call(this)
      : this.props.data;
    return reactive(data, (key, oldValue, newValue) => {
      this.update(key, oldValue, newValue);
    });
  }

  _initProvide() {
    if (this.props.provide) {
      return isFunction(this.props.provide)
        ? this.props.provide.call(this)
        : this.props.provide;
    }
    return {};
  }

  _handleInject(injections) {
    if (injections) {
      Object.keys(injections).forEach((key) => {
        const injection = injections[key];
        this[key] = injection;
      });
    }
  }

  _initSetup() {
    if (isFunction(this.props.setup)) {
      const setupContext = {
        attrs: this.props,
        slots: this.$slots,
        emit: this.$emit.bind(this),
        expose: this.$expose.bind(this),
      };

      const setupResult = this.props.setup(this.props, setupContext);

      if (setupResult) {
        if (typeof setupResult === "object") {
          Object.assign(this.data, this._unwrapRefs(setupResult));
        } else if (isFunction(setupResult)) {
          this.props.render = setupResult;
        }
      }
    }
  }

  _unwrapRefs(obj) {
    // 解包 ref 对象
    const result = {};
    for (const key in obj) {
      result[key] = isRef(obj[key]) ? obj[key].value : obj[key];
    }
    return result;
  }

  _initComputed() {
    Object.keys(this.props.computed).forEach((key) => {
      const getter = isFunction(this.props.computed[key])
        ? this.props.computed[key].bind(this)
        : () => this.props.computed[key];
      const computedValue = computed(getter);
      Object.defineProperty(this.data, key, {
        get: computedValue.get,
        enumerable: true,
      });
    });
  }

  _initWatch() {
    Object.keys(this.props.watch).forEach((key) => {
      const callback = isFunction(this.props.watch[key])
        ? this.props.watch[key].bind(this)
        : () => {};
      watch(this.data[key], callback, this);
    });
  }

  render() {
    this.props?.beforeMount?.call(this);
    const vnode = isFunction(this.props?.render)
      ? this.props.render.bind(this)({
          ...this.$scopedSlots,
          default: (scope) => this.$scopedSlots.default(scope),
        })
      : null;
    const el = isVNode(vnode) ? vnode.render(this.document) : vnode;
    this.props?.mounted?.call(this);
    // 在组件挂载完成，DOM 渲染后执行回调
    nextTick(() => {
      if (isFunction(this.props?.afterMount)) {
        this.props.afterMount.call(this);
      }
    });
    return el;
  }

  update(key, oldValue, newValue) {
    // 防抖逻辑
    if (this._pendingUpdate) return;
    this._pendingUpdate = true;

    nextTick(() => {
      this._pendingUpdate = false;
      this.props?.beforeUpdate?.call(this);

      // 使用 requestAnimationFrame 优化 DOM 更新
      requestAnimationFrame(() => {
        try {
          const newVnode = this.render();
          const newEl = isVNode(newVnode)
            ? newVnode.render(this.document)
            : newVnode;

          // 比较新旧 DOM 节点，相同则不更新
          if (this.el && this.el.isEqualNode(newEl)) {
            return;
          }

          updateProps(this.el, newEl);
          updateChildren(this.el, newEl);

          this.props?.updated?.call(this);
        } catch (error) {
          console.error("Update error:", error);
        }
      });
    });

    nextTick(() => {
      this.props?.afterUpdate?.call(this);
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
      if (isFunction(this.props?.afterUnmount)) {
        this.props.afterUnmount.call(this);
      }
    });
  }

  $emit(eventName, ...args) {
    const listeners = this.props?.on?.[eventName];
    if (listeners) {
      if (Array.isArray(listeners)) {
        listeners.forEach(
          (listener) => isFunction(listener) && listener.apply(this, args)
        );
      } else if (isFunction(listeners)) {
        listeners.apply(this, args);
      }
    }
    // 触发全局事件总线
    eventBus.dispatchEvent(new CustomEvent(eventName, { detail: args }));
  }

  $dispatch(eventName, detail) {
    let parent = this.parent;
    while (parent) {
      if (parent._events?.[eventName]) {
        parent._events[eventName].forEach((cb) => isFunction(cb) && cb(detail));
        break;
      }
      parent = parent.parent;
    }
  }

  $expose(exposed = {}) {
    if (typeof exposed !== "object" || exposed === null) {
      throw new TypeError("Exposed must be an object");
    }
    Object.assign(this._exposed, exposed);
  }

  initTemplate(template) {
    if (this.props.render) return;

    try {
      this.compiledTemplate = compileTemplate(template);
      this.props.render = () => {
        const html = this.compiledTemplate({
          ...toRefs(this.data),
          ...this.props,
        });
        const vnode = createVnode("div", { html });
        const el = vnode.render(this.document);
        this.el = el;
        return el;
      };
    } catch (error) {
      console.error("Template compilation error:", error);
    }
  }

  // 异步组件支持
  static asyncComponent(loader) {
    if (!isFunction(loader)) {
      throw new TypeError("Loader must be a function");
    }

    let InnerComponent = null;
    let error = null;

    return {
      render() {
        if (InnerComponent) {
          return createVnode(InnerComponent, this.props);
        } else if (error) {
          return createVnode("div", {}, "Error loading component");
        } else {
          return createVnode("div", {}, "Loading...");
        }
      },
      async created() {
        try {
          InnerComponent = await loader();
          this.$forceUpdate?.();
        } catch (err) {
          error = err;
          console.error("Async component load error:", error);
          this.$forceUpdate?.();
        }
      },
    };
  }

  $on(eventName, callback) {
    if (!isFunction(callback)) return;
    this._events[eventName] = this._events[eventName] || [];
    this._events[eventName].push(callback);
  }

  // 全局事件监听
  static on(eventName, callback) {
    if (!isFunction(callback)) return;
    eventBus.addEventListener(eventName, (e) => callback(...e.detail));
  }

  // 全局事件移除监听
  static off(eventName, callback) {
    if (!isFunction(callback)) return;
    eventBus.removeEventListener(eventName, (e) => callback(...e.detail));
  }
}

// 优化属性更新逻辑
const updateProps = (oldEl, newEl) => {
  if (!oldEl || !newEl) return;
  const oldAttrs = Object.fromEntries(
    Array.from(oldEl.attributes, (attr) => [attr.name, attr.value])
  );

  Array.from(newEl.attributes).forEach((attr) => {
    if (oldAttrs[attr.name] !== attr.value) {
      oldEl.setAttribute(attr.name, attr.value);
    }
    delete oldAttrs[attr.name];
  });

  // 移除旧元素中多余的属性
  Object.keys(oldAttrs).forEach((attrName) => {
    oldEl.removeAttribute(attrName);
  });
};

// 优化子节点更新逻辑
const updateChildren = (oldEl, newEl) => {
  if (!oldEl || !newEl) return;

  const oldChildren = Array.from(oldEl.childNodes);
  const newChildren = Array.from(newEl.childNodes);

  // 处理新增和更新节点
  newChildren.forEach((newChild, index) => {
    const oldChild = oldChildren[index];
    if (!oldChild) {
      oldEl.appendChild(newChild);
    } else if (
      oldChild.nodeType !== newChild.nodeType ||
      (oldChild.nodeType === Node.TEXT_NODE &&
        oldChild.textContent !== newChild.textContent) ||
      (oldChild.nodeType === Node.ELEMENT_NODE &&
        !oldChild.isEqualNode(newChild))
    ) {
      oldEl.replaceChild(newChild, oldChild);
    }
  });

  // 移除多余的旧节点
  while (oldEl.childNodes.length > newChildren.length) {
    oldEl.removeChild(oldEl.lastChild);
  }
};

const isComponent = function (obj) {
  return obj instanceof Component;
};

export { Component, isComponent };
