import { Component, createElem } from "../index.js";

const BackTop = new Component({
  // 初始化数据
  data() {
    return {
      visible: false,
    };
  },
  // 组件挂载后执行
  mounted() {
    window.addEventListener("scroll", () =>
      this.props.methods.handleScroll.bind(this)()
    );
    this.props.methods.handleScroll.bind(this)();
  },
  // 组件卸载前执行
  beforeUnmount() {
    window.removeEventListener("scroll", () =>
      this.props.methods.handleScroll.bind(this)()
    );
  },
  render() {
    const { right = 20, bottom = 20, visibilityHeight = 200 } = this.props;

    return createElem(
      "div",
      {
        class: "back-top" + (!this.data.visible ? " hidden" : ""),
        style: {
          right: `${right}px`,
          bottom: `${bottom}px`,
        },
        on: {
          click: this.props.methods.scrollToTop,
        },
      },
      createElem("i", { class: "back-top__icon iconfont icon-top" })
    );
  },
  methods: {
    // 处理滚动事件
    handleScroll() {
      const { visibilityHeight } = this.props;
      const scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;
      this.data.visible = scrollTop >= visibilityHeight;
    },
    // 滚动到页面顶部
    scrollToTop() {
      const scrollStep = -window.scrollY / (500 / 15);
      const scrollInterval = setInterval(() => {
        if (window.scrollY !== 0) {
          window.scrollBy(0, scrollStep);
        } else {
          clearInterval(scrollInterval);
        }
      }, 15);
    },
  },
});

export default BackTop;
