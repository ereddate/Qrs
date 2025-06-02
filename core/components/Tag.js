import { Component, createElem } from "../index.js";

export default new Component({
  render() {
    return createElem(
      "span",
      {
        class: `tag ${this.props.type ? "tag-" + this.props.type : ""}`,
        on: {
          click: () => this.props.on?.click?.(),
        },
      },
      this.props.children || this.props.text
    );
  },
});
