import { Component, createElem } from "../index.js";

export default new Component({
  render() {
    return createElem("div", { class: "upload" }, [
      createElem("input", {
        type: "file",
        on: {
          change: (e) => this.props.on.change?.(e.target.files[0]),
        },
      }),
    ]);
  },
});
