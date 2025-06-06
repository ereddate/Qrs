import { Component, createElem } from "../index.js";

const Dialog = new Component({
  // 初始化数据
  data() {
    return {
      visible: this.props.visible || false,
    };
  },
  render() {
    const {
      title = "",
      content = "",
      showCancelButton = false,
      cancelText = "取消",
      confirmText = "确认",
      closeOnClickOverlay = true,
    } = this.props;

    return createElem(
      "div",
      {
        class: "dialog-overlay" + (!this.data.visible ? " hidden" : ""),
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
            class: "dialog-container",
          },
          [
            title && createElem("div", { class: "dialog-title" }, title),
            createElem("div", { class: "dialog-content" }, content),
            createElem(
              "div",
              { class: "dialog-footer" },
              [
                showCancelButton &&
                  createElem(
                    "button",
                    {
                      class: "dialog-cancel",
                      on: {
                        click: () => {
                          this.props.on.cancel?.();
                          this.props.methods.close.bind(this)();
                        },
                      },
                    },
                    cancelText
                  ),
                createElem(
                  "button",
                  {
                    class: "dialog-confirm",
                    on: {
                      click: () => {
                        this.props.on.confirm?.();
                        this.props.methods.close.bind(this)();
                      },
                    },
                  },
                  confirmText
                ),
              ].filter(Boolean)
            ),
          ]
        ),
      ]
    );
  },
  methods: {
    // 打开对话框
    open() {
      this.data.visible = true;
    },
    // 关闭对话框
    close() {
      this.data.visible = false;
    },
  },
});

export default Dialog;
