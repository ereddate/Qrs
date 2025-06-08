import { isComponent } from "./component.js";
import { nextTick } from "./queue.js";
import { isTransition } from "./transition.js";

class VNode {
  constructor(tag, props = {}, children = [], key = null) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.parent = props.parent || null;
    this.el = null;
    this.key = key;
    this._cachedEl = null;
    this._eventListeners = {}; // 存储事件监听器，用于销毁时移除
    return this;
  }

  render(document) {
    const globalDocument = document || window.document;

    // 添加缓存机制
    if (this._cachedEl) return this._cachedEl;
    if (isComponent(this.tag)) {
      // 修正递归逻辑
      const newInstance = new this.tag.constructor({
        ...this.props,
      });
      const el = newInstance.render();
      this.el = el;
      return el;
    } else if (isVNode(this.tag)) {
      // 修正递归逻辑
      const newInstance = new this.tag.constructor(
        this.tag,
        {
          ...this.props,
        },
        this.children
      );
      const el = newInstance.render();
      this.el = el;
      return el;
    } else if (!String.is(this.tag)) {
      return;
    }
    const elem =
      this.tag === "text"
        ? globalDocument.createTextNode("")
        : globalDocument.createElement(this.tag);
    if (this.props) {
      updateProps.bind(this)(elem, this.props);
    }
    if (this.children) {
      updateChildren.bind(this)(elem, this.children);
    }
    this._cachedEl = elem; // 缓存结果
    this.el = elem;
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

  // 新增销毁方法
  destroy() {
    if (this.el) {
      // 移除事件监听器
      Object.entries(this._eventListeners).forEach(([event, handlers]) => {
        handlers.forEach((handler) => {
          this.el.removeEventListener(event, handler);
        });
      });

      // 递归销毁子节点
      if (this.children) {
        this.children.forEach((child) => {
          if (child instanceof VNode) {
            child.destroy();
          } else if (isComponent(child)) {
            const componentInstance = new child.constructor(child.props);
            if (componentInstance.el) {
              componentInstance.el.destroy?.();
            }
          }
        });
      }

      // 移除 DOM 节点
      if (this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }

      // 清理缓存和引用
      this.el = null;
      this._cachedEl = null;
      this._eventListeners = {};
    }
  }
}

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
          const handler = function () {
            props[key][event].call(props, ...arguments);
          };
          elem.addEventListener(event, handler);
          // 存储事件监听器，用于销毁时移除
          this._eventListeners[event] = this._eventListeners[event] || [];
          this._eventListeners[event].push(handler);
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
  if (String.is(children)) {
    elem.appendChild(document.createTextNode(children));
    return;
  }
  if (children instanceof Node) {
    elem.appendChild(children);
    return;
  }
  children.forEach((child) => {
    if (isComponent(child)) {
      const newComponent = new child.constructor({
        ...child.props,
        parent: this,
      });
      const rElem = newComponent.render();
      const el = isVNode(rElem) ? rElem.render() : rElem;
      newComponent.el = el;
      elem.appendChild(el);
    } else if (isVNode(child)) {
      const newVnode = new child.constructor(
        child.tag,
        { ...child.props, parent: this },
        child.children
      );
      const el = newVnode.render();
      elem.appendChild(el);
    } else if (String.is(child)) {
      if (/<[a-z][\s\S]*>/i.test(child)) {
        // 识别HTML字符串并转换为DOM节点
        const template = document.createElement("template");
        template.innerHTML = child.trim();
        const nodes = Array.from(template.content.childNodes).filter(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE ||
            (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "")
        );
        updateChildren.bind(this)(elem, nodes);
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

const createElem = (tag, props, ...children) => {
  if (isComponent(tag)) {
    const slots = [];
    slots.default = children;
    const newComponent = new tag.constructor({
      ...tag.props,
      ...props,
      slots,
      parent: this,
    });
    const elem = newComponent.render();
    newComponent.el = elem;
    return elem;
  }
  return createVnode(tag, props, children);
};

const createVnode = (tag, props, children, key = null) => {
  return new VNode(tag, props, children, key);
};

export { VNode, isVNode, updateProps, updateChildren, createElem, createVnode };
