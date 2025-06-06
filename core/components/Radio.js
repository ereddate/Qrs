import { Component, createElem } from "../index.js";

const Radio = new Component({
  // 初始化数据
  data() {
    return {
      checked: this.props.checked || false,
    };
  },
  render() {
    const { label, value, disabled = false, name = "radio-group" } = this.props;
    const { checked } = this.data;

    return createElem(
      "label",
      {
        class: `radio ${checked ? "checked" : ""} ${
          disabled ? "disabled" : ""
        }`,
        on: {
          click: () => {
            if (!disabled) {
              this.props.methods.handleClick.bind(this)();
            }
          },
        },
      },
      [
        // 单选按钮
        createElem("input", {
          class: "radio__input",
          type: "radio",
          name,
          value,
          checked,
          disabled,
          on: {
            change: (e) => {
              if (!disabled) {
                this.data.checked = e.target.checked;
                this.props.on.change?.(e.target.checked, value);
              }
            },
          },
        }),
        // 单选按钮图标
        createElem("span", {
          class: `radio__icon ${checked ? "checked" : ""}`,
        }),
        // 单选按钮文本
        label && createElem("span", { class: "radio__label" }, label),
      ]
    );
  },
  methods: {
    // 处理点击事件
    handleClick() {
      this.data.checked = true;
      this.props.on.change?.(true, this.props.value);
    },
  },
});

export default Radio;
