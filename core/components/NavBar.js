import { Component, createElem } from "../index.js";

const NavBar = new Component({
  render() {
    const {
      title = "标题",
      leftText = "返回",
      rightText = "",
      showLeftArrow = true,
      onLeftClick = () => {},
      onRightClick = () => {},
    } = this.props;

    return createElem(
      "div",
      {
        class: "nav-bar",
      },
      [
        // 左侧区域
        createElem(
          "div",
          {
            class: "nav-bar__left",
            on: {
              click: onLeftClick,
            },
          },
          [
            showLeftArrow &&
              createElem("i", {
                class: "nav-bar__arrow",
              }),
            leftText &&
              createElem(
                "span",
                {
                  class: "nav-bar__left-text",
                },
                leftText
              ),
          ].filter(Boolean)
        ),
        // 标题区域
        createElem(
          "div",
          {
            class: "nav-bar__title",
          },
          title
        ),
        // 右侧区域
        rightText &&
          createElem(
            "div",
            {
              class: "nav-bar__right",
              on: {
                click: onRightClick,
              },
            },
            [
              createElem(
                "span",
                {
                  class: "nav-bar__right-text",
                },
                rightText
              ),
            ]
          ),
      ]
    );
  },
});

export default NavBar;
