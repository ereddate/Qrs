import { Component, createElem } from "../index.js";

const Slider = new Component({
  // 初始化数据
  data() {
    return {
      value: this.props.value || this.props.min || 0,
      isDragging: false,
    };
  },
  render() {
    const { min = 0, max = 100, step = 1, disabled = false } = this.props;
    const { value, isDragging } = this.data;

    const percentage = ((this.data.value - min) / (max - min)) * 100;

    return createElem(
      "div",
      {
        class: `slider ${disabled ? "disabled" : ""}`,
        on: {
          mousedown: (e) => {
            if (!disabled) {
              this.props.methods.handleTrackClick.bind(this)(e);
            }
          },
        },
      },
      [
        // 轨道
        createElem(
          "div",
          {
            class: "slider__track",
          },
          [
            // 进度条
            createElem("div", {
              class: "slider__progress",
              style: { width: `${percentage}%` },
            }),
          ]
        ),
        // 滑块
        createElem("div", {
          class: `slider__button ${this.data.isDragging ? "dragging" : ""}`,
          style: { left: `${percentage}%` },
          on: {
            mousedown: (e) => {
              if (!disabled) {
                this.props.methods.handleButtonDown.bind(this)(e);
              }
            },
          },
        }),
      ]
    );
  },
  methods: {
    // 处理轨道点击事件
    handleTrackClick(e) {
      const trackRect = e.currentTarget.getBoundingClientRect();
      const trackWidth = trackRect.width;
      const clickX = e.clientX - trackRect.left;
      const ratio = clickX / trackWidth;
      const newValue = this.props.methods.calculateValue.bind(this)(ratio);
      this.props.methods.updateValue.bind(this)(newValue);
    },
    // 处理滑块按下事件
    handleButtonDown(e) {
      this.data.isDragging = true;
      document.addEventListener(
        "mousemove",
        this.props.methods.handleMouseMove.bind(this)
      );
      document.addEventListener(
        "mouseup",
        this.props.methods.handleMouseUp.bind(this)
      );
    },
    // 处理鼠标移动事件
    handleMouseMove(e) {
      if (this.data.isDragging) {
        const track = this.el.querySelector(".slider__track");
        const trackRect = track.getBoundingClientRect();
        const trackWidth = trackRect.width;
        const mouseX = e.clientX - trackRect.left;
        let ratio = mouseX / trackWidth;
        ratio = Math.max(0, Math.min(1, ratio));
        const newValue = this.props.methods.calculateValue.bind(this)(ratio);
        this.props.methods.updateValue.bind(this)(newValue);
      }
    },
    // 处理鼠标松开事件
    handleMouseUp() {
      this.data.isDragging = false;
      document.removeEventListener(
        "mousemove",
        this.props.methods.handleMouseMove
      );
      document.removeEventListener("mouseup", this.props.methods.handleMouseUp);
    },
    // 计算新的值
    calculateValue(ratio) {
      const { min, max, step } = this.props;
      const range = max - min;
      const rawValue = min + ratio * range;
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    // 更新值
    updateValue(newValue) {
      if (newValue !== this.data.value) {
        this.data.value = newValue;
        this.props.on.change?.(newValue);
      }
    },
  },
});

export default Slider;
