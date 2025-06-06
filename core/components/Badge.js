import { Component, createElem } from "../index.js";

const Badge = new Component({
  render() {
    const {
      value,
      max = 99,
      isDot = false,
      className = "",
      position = "top-right",
    } = this.props;

    let displayValue = value;
    if (typeof value === "number" && value > max) {
      displayValue = `${max}+`;
    }

    return createElem(
      "div",
      {
        class: `badge-container ${className}`,
      },
      [
        // 子元素
        this.props.children,
        // 徽章元素
        createElem(
          "div",
          {
            class: `badge ${isDot ? "is-dot" : ""} badge-${position}`,
          },
          isDot ? null : displayValue
        ),
      ]
    );
  },
});

export default Badge;
