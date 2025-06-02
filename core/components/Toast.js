import { Component, createElem } from "../index.js";

const Toast = new Component({
  render() {
    return createElem(
      "div",
      {
        class: `toast ${this.props.type || "info"}`,
        style: { display: "none" },
      },
      this.props.message
    );
  },
});

// 静态方法
Toast.show = (options) => {
  const toast = new Toast.constructor({ ...Toast.props, ...options });
  const el = toast.render();

  // 添加位置类
  const position = options.position || "bottom";
  el.classList.add(`toast-${position}`);

  document.body.appendChild(el);
  el.style.display = "block";

  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, options.duration || 2000);
};

export default Toast;
