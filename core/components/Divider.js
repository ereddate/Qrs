import { Component, createElem } from "../index.js";

const Divider = new Component({
  render() {
    const {
      content = "",
      contentPosition = "center", // 文本位置，可选值：left、center、right
      dashed = false, // 是否使用虚线
      hairline = true, // 是否使用细边框
    } = this.props;

    const dividerClass = [
      "divider",
      `divider--${contentPosition}`,
      dashed ? "divider--dashed" : "",
      hairline ? "divider--hairline" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return createElem(
      "div",
      {
        class: dividerClass,
      },
      content &&
        createElem(
          "span",
          {
            class: "divider__content",
          },
          content
        )
    );
  },
});

export default Divider;
