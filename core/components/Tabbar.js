import { Component, createElem } from "../index.js";

const Tabbar = new Component({
  // 初始化数据
  data() {
    return {
      active: this.props.active || 0,
    };
  },
  render() {
    const { items = [], zIndex = 100 } = this.props;
    const { active } = this.data;

    return createElem(
      "div",
      {
        class: "tabbar",
        style: {
          zIndex,
        },
      },
      items.map((item, index) =>
        createElem(
          "div",
          {
            class: `tabbar-item ${index === active ? "active" : ""}`,
            on: {
              click: () => {
                this.props.methods.handleItemClick.bind(this)(index);
              },
            },
          },
          [
            item.icon &&
              createElem("div", {
                class:
                  "tabbar-item__icon" +
                  (item.icon ? ` iconfont ${item.icon}` : ""),
              }),
            createElem(
              "div",
              {
                class: "tabbar-item__text",
              },
              item.text
            ),
          ]
        )
      )
    );
  },
  methods: {
    // 处理标签项点击事件
    handleItemClick(index) {
      this.data.active = index;
      this.props.on.change?.(index);
    },
  },
});

export default Tabbar;
