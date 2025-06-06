import { reactive, Component, createElem } from "../index.js";

const Input = new Component({
  data() {
    return {
      value: this.props.value || "",
    };
  },
  watch: {
    value(newVal) {
      this.props.on.change?.(newVal);
    },
  },
  render() {
    return createElem("input", {
      type: this.props.type || "text",
      class: `input ${this.props.class || ""}`,
      placeholder: this.props.placeholder,
      value: this.data.value,
      on: {
        input: (e) => (this.data.value = e.target.value),
      },
    });
  },
});
export default Input;
