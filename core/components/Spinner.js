import { Component, createElem } from "../index.js";

export default new Component({
  render() {
    return createElem("div", { class: "spinner" }, [
      createElem("div", { class: "spinner-dot" }),
      createElem("div", { class: "spinner-dot" }),
      createElem("div", { class: "spinner-dot" }),
    ]);
  },
});
