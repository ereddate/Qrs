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
      ]
    );
  },
});
export default Card;
