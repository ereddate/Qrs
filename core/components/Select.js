import { reactive, Component, createElem } from "../index.js";

export default new Component({
  data() {
    return {
      isOpen: false,
      selected: this.props.selected || null,
    };
  },
  render() {
    return createElem("div", { class: "select" }, [
      createElem(
        "div",
        {
          class: "select-selected",
          on: { click: () => (this.data.isOpen = !this.data.isOpen) },
        },
        this.data.selected ? this.data.selected.text : "请选择"
      ),
      this.data.isOpen &&
        createElem(
          "div",
          { class: "select-options" },
          this.props.options.map((option) =>
            createElem(
              "div",
              {
                class: "select-option",
                on: {
                  click: () => {
                    this.data.selected = option;
                    this.data.isOpen = false;
                    this.props.on.change?.(option);
                  },
                },
              },
              option.text
            )
          )
        ),
    ]);
  },
});
