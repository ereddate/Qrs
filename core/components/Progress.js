import { Component, createElem } from "../index.js";

export default new Component({
  render() {
    return createElem("div", { class: "progress" }, [
      createElem("div", {
        class: "progress-bar",
        style: {
          width: `${this.props.percent}%`,
        },
      }),
    ]);
  },
});
