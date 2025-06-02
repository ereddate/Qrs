import { reactive, Component, createElem } from "../index.js";

export default new Component({
  data() {
    return {
      showColorPanel: false,
      selectedColor: this.props.value || "#000000",
    };
  },
  render() {
    return createElem("div", { class: "color-picker" }, [
      createElem("div", {
        class: "color-preview",
        style: { backgroundColor: this.data.selectedColor },
        on: {
          click: () => (this.data.showColorPanel = !this.data.showColorPanel),
        },
      }),
      this.data.showColorPanel &&
        createElem("input", {
          type: "color",
          value: this.data.selectedColor,
          on: {
            change: (e) => {
              this.data.selectedColor = e.target.value;
              this.props.on.change?.(e.target.value);
            },
          },
        }),
    ]);
  },
});
