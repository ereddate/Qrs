import { reactive, Component, createElem } from "../index.js";

export default new Component({
  data() {
    return {
      activeTab: this.props.active || 0,
    };
  },
  render() {
    return createElem("div", { class: "tabs" }, [
      createElem(
        "div",
        { class: "tabs-header" },
        this.props.tabs.map((tab, index) =>
          createElem(
            "div",
            {
              class: `tab-header ${
                this.data.activeTab === index ? "active" : ""
              }`,
              on: { click: () => (this.data.activeTab = index) },
            },
            tab.title
          )
        )
      ),
      createElem(
        "div",
        { class: "tabs-content" },
        this.props.tabs[this.data.activeTab].content
      ),
    ]);
  },
});
