import { Component } from "../component.js";
import { createVnode } from "../vnode.js";

const Swipe = new Component({
  created() {
    this.currentIndex = 0;
    this.touchStartX = 0;
    this.animationFrame = null;
    this.autoPlayTimer = null;
  },
  mounted() {
    this.props.methods.startAutoPlay.bind(this)();
    this.props.methods.bindTouchEvents.bind(this)();
  },
  beforeUnmount() {
    this.props.methods.stopAutoPlay.bind(this)();
    this.props.methods.unbindTouchEvents.bind(this)();
  },
  methods: {
    startAutoPlay() {
      if (this.props.autoplay > 0) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = setInterval(() => {
          this.props.methods.next.bind(this)();
        }, this.props.autoplay);
      }
    },
    next() {
      const children = this.$slots.default;
      let currentIndex = (this.currentIndex + 1) % children.length;
      this.props.methods.updatePosition.bind(this)(currentIndex);
      this.$emit("change", this.currentIndex);
      this.currentIndex = currentIndex;
    },
    updatePosition(currentIndex) {
      const wrapper = this.el.querySelector(".swipe-wrapper");
      const offset = -currentIndex * 100;

      wrapper.style.transition = `transform ${this.props.duration}ms`;
      wrapper.style.transform = `translate3d(${offset}%, 0, 0)`;

      const indicators = this.el.querySelector(".swipe-indicators");
      Array.from(indicators.children).forEach((child, index) =>
        index === currentIndex
          ? child.classList.add("active")
          : child.classList.remove("active")
      );
    },
    bindTouchEvents() {
      if (this.el) {
        this.el.addEventListener(
          "touchstart",
          this.props.methods.handleTouchStart
        );
        this.el.addEventListener(
          "touchmove",
          this.props.methods.handleTouchMove
        );
        this.el.addEventListener("touchend", this.props.methods.handleTouchEnd);
      }
    },
    handleTouchStart(e) {
      this.touchStartX = e.touches[0].clientX;
      this.props.methods.stopAutoPlay.bind(this)();
    },
    handleTouchMove(e) {
      // 实现滑动逻辑
    },
    handleTouchEnd() {
      this.props.methods.startAutoPlay.bind(this)();
    },
    stopAutoPlay() {
      clearInterval(this.autoPlayTimer);
    },
  },
  render() {
    return createVnode("div", { class: "swipe" }, [
      createVnode("div", { class: "swipe-wrapper" }, this.$slots.default),
      this.props.indicators && this.props.renderIndicators.bind(this)(),
    ]);
  },
  renderIndicators() {
    const children = this.$slots.default;
    return createVnode(
      "div",
      { class: "swipe-indicators" },
      children.map((_, index) =>
        createVnode("div", {
          class:
            "swipe-indicator" + (index === this.currentIndex ? " active" : ""),
        })
      )
    );
  },
});

export default Swipe;
