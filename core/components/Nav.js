import { reactive, Component, createElem } from "../index.js";

const Nav = new Component({
  data() {
    return {
      activeIndex: this.props.activeIndex || 0,
    };
  },
  render() {
    return createElem(
      "div",
      { class: "nav" },
      this.props.items.map((item, index) =>
        createElem(
          "div",
          {
            class: `nav-item ${
              this.data.activeIndex === index ? "active" : ""
            }`,
            on: {
              click: () => {
                this.data.activeIndex = index;
                this.props.on.change?.(item);
              },
            },
          },
          item.text
        )
      )
    );
  },
});
export default Nav;
