import { isComponent } from "./component.js";
import { isVNode } from "./vnode.js";
import { nextTick } from "./queue.js";

const isTransition = function (obj) {
  return obj instanceof Transition;
};

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

export { Transition, isTransition };
