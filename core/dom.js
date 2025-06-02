import { Component, VNode } from "./index.js";

class Dom {
  constructor(selector) {
    if (typeof selector === "string") {
      this.el = document.querySelector(selector);
    } else if (selector instanceof HTMLElement) {
      this.el = selector;
    } else if (selector instanceof Dom) {
      this.el = selector.el;
    } else {
      this.el = null;
    }
    return this;
  }

  // DOM查询方法
  find(selector) {
    if (selector instanceof HTMLElement) {
      return new Dom(selector);
    }
    return new Dom(this.el?.querySelector(selector));
  }

  findAll(selector) {
    return Array.from(this.el?.querySelectorAll(selector) || []).map(
      (el) => new Dom(el)
    );
  }

  toComponent() {
    return new Component({
      render: () => this.el,
    });
  }

  fromComponent(component) {
    const newComponent = component.render();
    return new Dom(newComponent);
  }

  toVNode() {
    if (!this.el) return null;
    return new VNode(
      this.el.tagName.toLowerCase(),
      { ...this.el.dataset },
      Array.from(this.el.childNodes).map((node) => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        return new Dom(node).toVNode();
      })
    );
  }

  static fromVNode(vnode) {
    return new Dom(vnode.render());
  }

  parent() {
    return new Dom(this.el?.parentNode);
  }

  children() {
    return Array.from(this.el?.children || []).map((el) => new Dom(el));
  }

  siblings() {
    if (!this.el?.parentNode) return [];
    return Array.from(this.el.parentNode.children)
      .filter((child) => child !== this.el)
      .map((el) => new Dom(el));
  }

  next() {
    return new Dom(this.el?.nextElementSibling);
  }

  prev() {
    return new Dom(this.el?.previousElementSibling);
  }

  // 样式操作
  css(styles) {
    if (this.el && styles) {
      Object.assign(this.el.style, styles);
    }
    return this;
  }

  hasClass(className) {
    return this.el?.classList.contains(className) || false;
  }

  addClass(className) {
    this.el?.classList.add(className);
    return this;
  }

  removeClass(className) {
    this.el?.classList.remove(className);
    return this;
  }

  toggleClass(className) {
    this.el?.classList.toggle(className);
    return this;
  }

  // 属性操作
  attr(name, value) {
    if (value !== undefined) {
      this.el?.setAttribute(name, value);
      return this;
    }
    return this.el?.getAttribute(name);
  }

  removeAttr(name) {
    this.el?.removeAttribute(name);
    return this;
  }

  data(key, value) {
    if (value !== undefined) {
      this.el.dataset[key] = JSON.stringify(value);
      return this;
    }
    try {
      return this.el?.dataset[key]
        ? JSON.parse(this.el.dataset[key])
        : undefined;
    } catch {
      return this.el?.dataset[key];
    }
  }

  // 事件处理
  on(event, selector, handler) {
    if (typeof selector === "function") {
      handler = selector;
      this._handlers = this._handlers || [];
      this._handlers.push({ event, handler });
      this.el?.addEventListener(event, handler);
    } else {
      const delegateHandler = (e) => {
        if (e.target.matches(selector)) handler.call(e.target, e);
      };
      this._delegates = this._delegates || [];
      this._delegates.push({ event, handler: delegateHandler });
      this.el?.addEventListener(event, delegateHandler);
    }
    return this;
  }

  off(event, handler) {
    // 清理普通事件
    (this._handlers || [])
      .filter((h) => h.event === event && (!handler || h.handler === handler))
      .forEach((h) => {
        this.el?.removeEventListener(h.event, h.handler);
      });

    // 清理委托事件
    (this._delegates || [])
      .filter(
        (d) => d.event === event && (!handler || d.originalHandler === handler)
      )
      .forEach((d) => {
        this.el?.removeEventListener(d.event, d.handler);
      });

    return this;
  }

  // 显示隐藏
  show() {
    this.el.style.display = "";
    return this;
  }

  hide() {
    this.el.style.display = "none";
    return this;
  }

  // DOM操作
  append(child) {
    if (!child || !this.el) return this;

    const node =
      child instanceof Dom
        ? child.el
        : child instanceof HTMLElement
        ? child
        : typeof child === "string"
        ? document.createTextNode(child)
        : null;

    if (node) this.el.appendChild(node);
    return this;
  }

  prepend(child) {
    if (!child || !this.el) return this;

    const node =
      child instanceof Dom
        ? child.el
        : child instanceof HTMLElement
        ? child
        : typeof child === "string"
        ? document.createTextNode(child)
        : null;

    if (node) this.el.insertBefore(node, this.el.firstChild);
    return this;
  }

  before(newNode) {
    if (this.el?.parentNode) {
      this.el.parentNode.insertBefore(
        newNode instanceof Dom ? newNode.el : newNode,
        this.el
      );
    }
    return this;
  }

  after(newNode) {
    if (this.el?.parentNode) {
      this.el.parentNode.insertBefore(
        newNode instanceof Dom ? newNode.el : newNode,
        this.el.nextSibling
      );
    }
    return this;
  }

  remove() {
    this.el?.remove();
    return this;
  }

  empty() {
    if (this.el) {
      while (this.el.firstChild) {
        this.el.removeChild(this.el.firstChild);
      }
    }
    return this;
  }

  // 表单操作
  val(value) {
    if (value !== undefined) {
      this.el.value = value;
      return this;
    }
    return this.el?.value;
  }

  // 尺寸和位置
  width() {
    return this.el?.clientWidth;
  }

  height() {
    return this.el?.clientHeight;
  }

  offset() {
    if (!this.el) return null;
    const rect = this.el.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
    };
  }

  position() {
    if (!this.el) return null;
    return {
      top: this.el.offsetTop,
      left: this.el.offsetLeft,
    };
  }

  isVisible() {
    return this.el
      ? !!(
          this.el.offsetWidth ||
          this.el.offsetHeight ||
          this.el.getClientRects().length
        )
      : false;
  }

  clone(deep = true) {
    return this.el ? new Dom(this.el.cloneNode(deep)) : null;
  }

  matches(selector) {
    return this.el ? this.el.matches(selector) : false;
  }

  trigger(eventName, detail = {}) {
    if (!this.el) return this;
    const event = new CustomEvent(eventName, { detail, bubbles: true });
    this.el.dispatchEvent(event);
    return this;
  }

  formData() {
    if (!this.el || this.el.tagName !== "FORM") return null;
    return Object.fromEntries(new FormData(this.el));
  }

  serialize() {
    if (!this.el || this.el.tagName !== "FORM") return "";
    return new URLSearchParams(new FormData(this.el)).toString();
  }

  closest(selector) {
    return this.el?.closest ? new Dom(this.el.closest(selector)) : null;
  }

  appendTo(parent) {
    if (parent instanceof Dom) parent.el?.appendChild(this.el);
    else if (parent instanceof HTMLElement) parent.appendChild(this.el);
    else if (typeof parent === "string") {
      const parentEl = document.querySelector(parent);
      if (parentEl) parentEl.appendChild(this.el);
    }
    return this;
  }

  createFragment(html) {
    const fragment = document.createDocumentFragment();
    const temp = document.createElement("div");
    temp.innerHTML = html;
    while (temp.firstChild) {
      fragment.appendChild(temp.firstChild);
    }
    return new Dom(fragment);
  }

  appendHTML(html) {
    if (!this.el) return this;
    const fragment = document.createRange().createContextualFragment(html);
    this.el.appendChild(fragment);
    return this;
  }

  html(content) {
    if (content !== undefined) {
      this.el.innerHTML = content;
      return this;
    }
    return this.el?.innerHTML;
  }

  insertAdjacent(position, content) {
    const positions = ["beforebegin", "afterbegin", "beforeend", "afterend"];
    if (!positions.includes(position)) return this;

    if (content instanceof Dom) {
      this.el.insertAdjacentElement(position, content.el);
    } else if (typeof content === "string") {
      this.el.insertAdjacentHTML(position, content);
    }
    return this;
  }

  destroy() {
    // 清理所有事件监听
    (this._handlers || []).forEach((h) => {
      this.el?.removeEventListener(h.event, h.handler);
    });
    (this._delegates || []).forEach((d) => {
      this.el?.removeEventListener(d.event, d.handler);
    });

    // 清理动画队列
    this._animationQueue = [];

    // 移除DOM引用
    this.el = null;
  }

  transition(properties, duration = 300, easing = "ease") {
    if (!this.el) return this;

    const transitions = Object.entries(properties)
      .map(([prop, value]) => `${prop} ${duration}ms ${easing}`)
      .join(", ");

    this.css({
      transition: transitions,
      ...properties,
    });

    return this;
  }

  isAnimating() {
    return !!this._animationQueue?.length;
  }

  delay(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  stop(clearQueue = false) {
    if (this._animationQueue) {
      if (clearQueue) this._animationQueue = [];
      cancelAnimationFrame(this._currentAnimation);
    }
    return this;
  }

  // 动画效果
  animate(properties, duration = 400, easing = "linear", complete) {
    if (!this.el) return this;

    this._animationQueue = this._animationQueue || [];
    const animationTask = () => {
      const startValues = {};
      const changes = {};

      Object.keys(properties).forEach((key) => {
        startValues[key] = parseFloat(getComputedStyle(this.el)[key]) || 0;
        changes[key] = properties[key] - startValues[key];
      });

      const startTime = performance.now();

      const animateFrame = (time) => {
        let progress = (time - startTime) / duration;
        if (progress > 1) progress = 1;

        const easedProgress =
          easing === "linear"
            ? progress
            : easing === "ease-in"
            ? progress * progress
            : easing === "ease-out"
            ? progress * (2 - progress)
            : Math.sin((progress * Math.PI) / 2); // ease-in-out

        Object.keys(properties).forEach((key) => {
          this.el.style[key] =
            startValues[key] + changes[key] * easedProgress + "px";
        });

        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        } else {
          this._animationQueue.shift();
          if (this._animationQueue.length > 0) {
            this._animationQueue[0]();
          }
          complete?.();
        }
      };

      requestAnimationFrame(animateFrame);
    };

    if (this._animationQueue.length === 0) {
      this._animationQueue.push(animationTask);
      animationTask();
    } else {
      this._animationQueue.push(animationTask);
    }

    return this;
  }
}

export default Dom;
