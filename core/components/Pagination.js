import { reactive, Component, createElem } from "../index.js";

export default new Component({
  data() {
    return {
      current: this.props.current || 1,
    };
  },
  render() {
    const totalPages = Math.ceil(this.props.total / this.props.pageSize);
    return createElem("div", { class: "pagination" }, [
      createElem(
        "button",
        {
          disabled: this.data.current <= 1,
          on: { click: () => this.data.current-- },
        },
        "上一页"
      ),
      Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
        createElem(
          "button",
          {
            class: page === this.data.current ? "active" : "",
            on: { click: () => (this.data.current = page) },
          },
          page
        )
      ),
      createElem(
        "button",
        {
          disabled: this.data.current >= totalPages,
          on: { click: () => this.data.current++ },
        },
        "下一页"
      ),
    ]);
  },
});
