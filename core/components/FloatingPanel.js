import { Component, createElem } from "../index.js";

const FloatingPanel = new Component({
  // 初始化数据
  data() {
    return {
      isOpen: this.props.visible || false,
      startY: 0,
      currentY: 0,
      isDragging: false,
    };
  },
  render() {
    const {
      title = "",
      content,
      actions = [],
      zIndex = 1000,
      closeOnClickOverlay = true,
    } = this.props;

    return createElem(
      "div",
      {
        class: "floating-panel-overlay" + (!this.data.isOpen ? " hidden" : ""),
        style: { zIndex },
        on: {
          click: (e) => {
            if (closeOnClickOverlay && e.target === e.currentTarget) {
              this.props.methods.close.bind(this)();
            }
          },
        },
      },
      [
        createElem(
          "div",
          {
            class: "floating-panel",
            on: {
              touchstart: (e) =>
                this.props.methods.handleTouchStart.bind(this)(e),
              touchmove: (e) =>
                this.props.methods.handleTouchMove.bind(this)(e),
              touchend: () => this.props.methods.handleTouchEnd.bind(this)(),
            },
          },
          [
            createElem(
              "div",
              {
                class: "floating-panel__header",
              },
              [
                createElem(
                  "span",
                  {
                    class: "floating-panel__title",
                  },
                  title
                ),
                createElem(
                  "button",
                  {
                    class: "floating-panel__close",
                    on: {
                      click: () => this.props.methods.close.bind(this)(),
                    },
                  },
                  "×"
                ),
              ]
            ),
            createElem(
              "div",
              {
                class: "floating-panel__content",
              },
              content
            ),
            actions.length > 0 &&
              createElem(
                "div",
                {
                  class: "floating-panel__actions",
                },
                actions.map((action) =>
                  createElem(
                    "button",
                    {
                      class: "floating-panel__action",
                      on: {
                        click: () => {
                          action.on.click?.();
                          if (action.closeOnClick) {
                            this.props.methods.close.bind(this)();
                          }
                        },
                      },
                    },
                    action.text
                  )
                )
              ),
          ]
        ),
      ]
    );
  },
  methods: {
    // 打开面板
    open() {
      this.data.isOpen = true;
    },
    // 关闭面板
    close() {
      this.data.isOpen = false;
    },
    // 处理触摸开始事件
    handleTouchStart(e) {
      this.data.isDragging = true;
      this.data.startY = e.touches[0].clientY;
      this.data.currentY = 0;
    },
    // 处理触摸移动事件
    handleTouchMove(e) {
      if (this.data.isDragging) {
        const currentY = e.touches[0].clientY;
        this.data.currentY = currentY - this.data.startY;
        // 简单限制滑动范围
        if (this.data.currentY < 0) {
          this.data.currentY = 0;
        }
        const panel = this.el.querySelector(".floating-panel");
        if (panel) {
          panel.style.transform = `translateY(${this.data.currentY}px)`;
        }
      }
    },
    // 处理触摸结束事件
    handleTouchEnd() {
      if (this.data.isDragging) {
        this.data.isDragging = false;
        const panel = this.el.querySelector(".floating-panel");
        if (panel) {
          if (this.data.currentY > 100) {
            this.props.methods.close.bind(this)();
          } else {
            panel.style.transform = "translateY(0)";
          }
        }
      }
    },
  },
});

export default FloatingPanel;
