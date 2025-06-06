import { Component, createElem } from "../index.js";

const DropdownMenu = new Component({
  // 初始化数据
  data() {
    return {
      activeIndex: -1,
    };
  },
  render() {
    const { options, zIndex = 999 } = this.props;
    const { activeIndex } = this.data;

    return createElem(
      "div",
      {
        class: "dropdown-menu",
        style: { zIndex },
      },
      [
        createElem(
          "div",
          {
            class: "dropdown-menu__header",
          },
          options.map((option, index) =>
            createElem(
              "div",
              {
                class: `dropdown-menu__item ${
                  index === this.data.activeIndex ? "active" : ""
                }`,
                on: {
                  click: () => {
                    this.props.methods.toggleMenu.bind(this)(index);
                  },
                },
              },
              [
                createElem(
                  "span",
                  {
                    class: "dropdown-menu__title",
                  },
                  option.selectedText || option.title
                ),
                createElem("i", {
                  class: `dropdown-menu__icon ${
                    index === this.data.activeIndex ? "active" : ""
                  }`,
                }),
              ]
            )
          )
        ),
        this.data.activeIndex > -1 &&
          createElem(
            "div",
            {
              class: "dropdown-menu__mask",
              on: {
                click: () => {
                  this.props.methods.closeMenu.bind(this)();
                },
              },
            },
            createElem(
              "div",
              {
                class: "dropdown-menu__content",
              },
              options[this.data.activeIndex].items.map((item) =>
                createElem(
                  "div",
                  {
                    class: `dropdown-menu__option ${
                      item.value ===
                      options[this.data.activeIndex].selectedValue
                        ? "selected"
                        : ""
                    }`,
                    on: {
                      click: () => {
                        this.props.methods.selectOption.bind(this)(
                          this.data.activeIndex,
                          item
                        );
                      },
                    },
                  },
                  item.text
                )
              )
            )
          ),
      ].filter(Boolean)
    );
  },
  methods: {
    // 切换菜单展开状态
    toggleMenu(index) {
      if (this.data.activeIndex === index) {
        this.props.methods.closeMenu.bind(this)();
      } else {
        this.data.activeIndex = index;
      }
    },
    // 关闭菜单
    closeMenu() {
      this.data.activeIndex = -1;
    },
    // 选择菜单项
    selectOption(menuIndex, option) {
      const newOptions = [...this.props.options];
      newOptions[menuIndex].selectedValue = option.value;
      newOptions[menuIndex].selectedText = option.text;
      this.props.on.change?.(menuIndex, option);
      this.props.methods.closeMenu.bind(this)();
    },
  },
});

export default DropdownMenu;
