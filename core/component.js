import { reactive, computed, watch, ref, isRef, toRefs } from "./reactive.js";
import { nextTick } from "./queue.js";
import compileTemplate from "./templateCompiler.js";
import { createVnode, isVNode } from "./vnode.js";
import { EventBus } from "./eventBus.js";

// 定义全局的事件总线
const eventBus = new EventBus();

// 组件类
class Component {
  constructor(props, document) {
    const that = this;
    this.props?.beforeCreated?.call(this);
    this.props = props;
    const { template } = props;
    // 新增：初始化 slots
    this.$slots = props.slots || {};
    this.data = reactive(
      Function.is(props.data) ? props.data.call(this) : props.data || {},
      function (key, oldValue, newValue) {
        that.update(key, oldValue, newValue);
      }
    );
    this.document = document;

    // 处理 setup 函数
    if (props.setup) {
      this.setupContext = {
        attrs: this.props,
        slots: this.$slots,
        emit: this.$emit.bind(this),
        expose: this.$expose.bind(this),
      };
      const setupResult = props.setup(this.props, this.setupContext);
      if (setupResult) {
        if (typeof setupResult === "object") {
          Object.assign(this.data, this._unwrapRefs(setupResult));
        } else if (typeof setupResult === "function") {
          this.props.render = setupResult;
        }
      }
    }

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

    // 处理 template
    if (template) {
      this.initTemplate(template);
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

  // 解包 ref
  _unwrapRefs(obj) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        isRef(value) ? value.value : value,
      ])
    );
  }

  render() {
    this.props?.beforeMount?.call(this);
    const vnode = this.props?.render.bind(this)(this.$slots);
    const el = isVNode(vnode) ? vnode.render(this.document) : vnode;
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
        const newVnode = this.render();
        const newEl = isVNode(newVnode)
          ? newVnode.render(this.document)
          : newVnode;
        // 比较新旧 DOM 节点，若相同则不更新
        if (this.el && this.el.isEqualNode(newEl)) {
          return;
        }

        updateProps.bind(this)(this.el, newEl);
        updateChildren.bind(this)(this.el, newEl);
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
    // 触发全局事件总线
    eventBus.dispatchEvent(new CustomEvent(eventName, { detail: args }));
  }

  $expose(exposed) {
    Object.assign(this._exposed, exposed);
  }

  initTemplate(template) {
    // 若 options 中已有 render 函数，不处理 template
    if (this.props.render) {
      return;
    }
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
  }

  // 异步组件支持
  static asyncComponent(loader) {
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
          this.$forceUpdate();
        } catch (err) {
          error = err;
          this.$forceUpdate();
        }
      },
    };
  }

  // 全局事件监听
  static on(eventName, callback) {
    eventBus.addEventListener(eventName, (e) => callback(...e.detail));
  }

  // 全局事件移除监听
  static off(eventName, callback) {
    eventBus.removeEventListener(eventName, (e) => callback(...e.detail));
  }
}

// 优化属性更新逻辑
const updateProps = (oldEl, newEl) => {
  if (!oldEl || !newEl) return;
  const oldAttrs = {};
  for (let i = 0; i < oldEl.attributes.length; i++) {
    const attr = oldEl.attributes[i];
    oldAttrs[attr.name] = attr.value;
  }

  for (let i = 0; i < newEl.attributes.length; i++) {
    const attr = newEl.attributes[i];
    if (oldAttrs[attr.name] !== attr.value) {
      oldEl.setAttribute(attr.name, attr.value);
    }
    delete oldAttrs[attr.name];
  }

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
    } else if (!oldChild.isEqualNode(newChild)) {
      oldEl.replaceChild(newChild, oldChild);
    }
  });

  // 移除多余的旧节点
  while (oldChildren.length > newChildren.length) {
    oldEl.removeChild(oldChildren.pop());
  }
};

const isComponent = function (obj) {
  return obj instanceof Component;
};

export { Component, isComponent };
