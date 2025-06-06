import { Component, createElem } from "../index.js";

const Message = new Component({
  render() {
    return createElem(
      "div",
      { class: `message ${this.props.type || "info"}` },
      this.props.content
    );
  },
});

// 静态方法
Message.show = (options) => {
  const msg = new Message.constructor({ ...Message.props, ...options });
  const el = msg.render();
  msg.el = el;
  document.body.appendChild(el);
  setTimeout(() => {
    msg.el.remove();
  }, options.duration || 3000);
};

export default Message;
