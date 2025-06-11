import { Component } from "../component.js";
import { createVnode } from "../vnode.js";

const Space = new Component({
  render() {
    const style = {
      display: "flex",
      flexDirection: this.props.direction === "horizontal" ? "row" : "column",
      alignItems: this.props.methods._getAlignment.bind(this)(),
      flexWrap: this.props.wrap ? "wrap" : "nowrap",
      gap: `${this.props.spacer}px`,
    };

    return createVnode(
      "div",
      {
        class: "x-space",
        style,
      },
      this.props.methods._wrapChildren.bind(this)()
    );
  },
  methods: {
    _getAlignment() {
      const map = {
        start: "flex-start",
        end: "flex-end",
        center: "center",
        baseline: "baseline",
      };
      return map[this.props.alignment] || "center";
    },
    _wrapChildren() {
      return this.$slots.default.map((child, index) => {
        return createVnode(
          "div",
          {
            style: this.props.methods._getChildStyle.bind(this)(index),
          },
          child
        );
      });
    },
    _getChildStyle(index) {
      const isLast = index === this.$slots.default.length - 1;
      const marginType =
        this.props.direction === "horizontal" ? "marginRight" : "marginBottom";

      return {
        [marginType]: isLast ? null : `${this.props.spacer}px`,
        display: "inline-flex",
        flexShrink: 0,
      };
    },
  },
});

export default Space;
