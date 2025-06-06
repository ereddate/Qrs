import { Component, createElem } from "../index.js";

const Stepper = new Component({
  // 初始化数据
  data() {
    return {
      value: this.props.value || this.props.min || 0,
    };
  },
  render() {
    const { min = 0, max = Infinity, step = 1, disabled = false } = this.props;

    return createElem(
      "div",
      {
        class: "stepper",
      },
      [
        // 减少按钮
        createElem(
          "button",
          {
            class: `stepper-btn stepper-btn-minus ${
              this.data.value <= min ? "disabled" : ""
            }`,
            disabled: this.data.value <= min || disabled,
            on: {
              click: () => {
                if (this.data.value > min && !disabled) {
                  const newValue = Math.max(this.data.value - step, min);
                  this.data.value = newValue;
                  this.props.on.change?.(newValue);
                }
              },
            },
          },
          "-"
        ),
        // 输入框
        createElem("input", {
          class: "stepper-input",
          type: "number",
          value: this.data.value,
          disabled: disabled,
          on: {
            input: (e) => {
              let inputValue = Number(e.target.value);
              if (isNaN(inputValue)) {
                inputValue = min;
              }
              inputValue = Math.max(Math.min(inputValue, max), min);
              this.data.value = inputValue;
              this.props.on.change?.(inputValue);
            },
          },
        }),
        // 增加按钮
        createElem(
          "button",
          {
            class: `stepper-btn stepper-btn-plus ${
              this.data.value >= max ? "disabled" : ""
            }`,
            disabled: this.data.value >= max || disabled,
            on: {
              click: () => {
                if (this.data.value < max && !disabled) {
                  const newValue = Math.min(this.data.value + step, max);
                  this.data.value = newValue;
                  this.props.on.change?.(newValue);
                }
              },
            },
          },
          "+"
        ),
      ]
    );
  },
});

export default Stepper;
