import { Component, createElem } from "../index.js";

const Notification = new Component({
  render() {
    return createElem(
      "div",
      {
        class: `notification ${this.props.type || "info"}`,
        style: { display: "none" },
      },
      this.props.message
    );
  },
});

// 静态方法
Notification.show = (options) => {
  const notification = new Notification.constructor({
    ...Notification.props,
    ...options,
  });
  const el = notification.render();
  document.body.appendChild(el);
  el.style.display = "block";

  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, options.duration || 3000);
};

export default Notification;
