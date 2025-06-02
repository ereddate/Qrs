import { reactive, Component, createElem } from "../index.js";

export default new Component({
  data() {
    return {
      isActive: this.props.value || false,
    };
  },
  render() {
    return createElem(
      "div",
      {
        class: `switch ${this.data.isActive ? "active" : ""}`,
        on: {
          click: () => {
            this.data.isActive = !this.data.isActive;
            this.props.on.change?.(this.data.isActive);
          },
        },
      },
      [createElem("div", { class: "switch-handle" })]
    );
  },
});
