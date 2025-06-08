import { Component, createElem } from "../index.js";

const Card = new Component({
  render() {
    return createElem(
      "div",
      {
        class: `card ${this.props.class || ""}`,
        style: this.props.style,
      },
      [
        this.props.title &&
          createElem("div", { class: "card-header" }, this.props.title),
        createElem("div", { class: "card-body" }, this.props.children),
        this.props.footer &&
          createElem("div", { class: "card-footer" }, this.props.footer),
      ]
    );
  },
});
export default Card;
