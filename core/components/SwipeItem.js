import { Component } from "../component.js";
import { createVnode } from "../vnode.js";

const SwipeItem = new Component({
  render() {
    return createVnode(
      "div",
      {
        class: "swipe-item",
        style: { width: "100%" },
      },
      this.$slots.default
    );
  },
});

export default SwipeItem;
