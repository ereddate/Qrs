import { Component, createElem } from "../index.js";
import "../ui/base.scss";

const Button = new Component({
  render() {
    return createElem(
      "button",
      {
        class: `btn ${this.props.type ? "btn-" + this.props.type : ""}`,
        style: this.props.style,
        disabled: this.props.disabled || false,
        on: {
          click: (e) => this.props.on.click?.(e),
        },
      },
      this.props.children || this.props.text
    );
  },
});

export default Button;
