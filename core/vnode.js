import { isComponent } from "./component.js";
import { nextTick } from "./queue.js";
import { isTransition } from "./transition.js";

// 工具函数优化
const isString = (val) => typeof val === "string";
const isFunction = (val) => typeof val === "function";

class VNode {
  constructor(tag, props = {}, children = [], key = null) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.parent = props.parent || null;
    this.el = null;
    this.key = key;
    this._cachedEl = null;
    this._eventListeners = {};
  }

  render(document) {
    const globalDocument = document || window.document;
    if (this._cachedEl) return this._cachedEl;

    if (isComponent(this.tag)) {
      const newInstance = new this.tag.constructor({ ...this.props });
      const el = newInstance.render();
      this.el = el;
      return el;
    } else if (isVNode(this.tag)) {
      const newInstance = new this.tag.constructor(
        this.tag,
        { ...this.props },
        this.children
      );
      const el = newInstance.render();
      this.el = el;
      return el;
    } else if (!isString(this.tag)) {
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
    this._cachedEl = elem;
    this.el = elem;
    return elem;
  }

  shouldUpdate(newVNode) {
    if (this.tag !== newVNode.tag) return true;
    if (JSON.stringify(this.props) !== JSON.stringify(newVNode.props))
      return true;
    if (JSON.stringify(this.children) !== JSON.stringify(newVNode.children))
      return true;
    return false;
  }

  destroy() {
    if (this.el) {
      Object.entries(this._eventListeners).forEach(([event, handlers]) => {
        handlers.forEach((handler) => {
          this.el.removeEventListener(event, handler);
        });
      });

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

      if (this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }

      this.el = null;
      this._cachedEl = null;
      this._eventListeners = {};
    }
  }
}

const isVNode = (obj) => obj instanceof VNode;

const updateProps = function (elem, props) {
  const styleObj = {};
  Object.keys(props).forEach((key) => {
    const currentValue = key === "style" ? elem.style.cssText : elem[key];
    const newValue = props[key];
    if (currentValue === newValue) return;
    switch (key) {
      case "style":
        Object.assign(styleObj, props[key]);
        break;
      case "class":
        const classes = Array.isArray(props[key])
          ? props[key]
              .map((item) =>
                typeof item === "object"
                  ? Object.keys(item)
                      .filter((k) => item[k])
                      .join(" ")
                  : item
              )
              .join(" ")
          : typeof props[key] === "object"
          ? Object.keys(props[key])
              .filter((k) => props[key][k])
              .join(" ")
          : props[key];
        elem.className = classes;
        break;
      case "html":
        elem.innerHTML = props[key];
        break;
      case "show":
        elem.style.display = props[key] ? "block" : "none";
        break;
      case "text":
        elem.appendChild(document.createTextNode(props[key]));
        break;
      case "on":
        Object.keys(props[key]).forEach((event) => {
          const handler = (...args) => {
            props[key][event].call(props, ...args);
          };
          elem.addEventListener(event, handler);
          this._eventListeners[event] = this._eventListeners[event] || [];
          this._eventListeners[event].push(handler);
        });
        break;
      default:
        elem.setAttribute(key, props[key]);
        break;
    }
  });
  if (Object.keys(styleObj).length > 0) {
    Object.assign(elem.style, styleObj);
  }
  nextTick(() => {
    if (isFunction(elem.props?.afterPropsUpdate)) {
      elem.props.afterPropsUpdate.call(elem);
    }
  });
};

const updateChildren = function (elem, children) {
  if (isString(children)) {
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
    } else if (isString(child)) {
      if (/<[a-z][\s\S]*>/i.test(child)) {
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
    } else if (Array.isArray(child)) {
      updateChildren.bind(this)(elem, child);
    } else if (isTransition(child)) {
      const transitionEl = child.render();
      updateChildren.bind(this)(elem, transitionEl);
      nextTick(() => {
        child.triggerTransition();
      });
    } else if (child instanceof Node) {
      elem.appendChild(child);
    } else if (
      typeof child !== "undefined" &&
      child !== false &&
      child !== null
    ) {
      updateChildren.bind(this)(elem, [child.toString()]);
    }
  });
  nextTick(() => {
    if (isFunction(elem.props?.afterChildrenUpdate)) {
      elem.props.afterChildrenUpdate.call(elem);
    }
  });
};

const createElem = (tag, props, ...children) => {
  if (isComponent(tag)) {
    const slots = {};
    children.forEach((child) => {
      if (child?.props?.slot) {
        const slotName = child.props.slot;
        slots[slotName] = slots[slotName] || [];
        slots[slotName].push(child);
      } else {
        slots.default = slots.default || [];
        slots.default.push(child);
      }
    });
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
