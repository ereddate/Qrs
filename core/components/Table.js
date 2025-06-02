import { reactive, Component, createElem } from "../index.js";

export default new Component({
  render() {
    return createElem("div", { class: "table-container" }, [
      createElem("table", { class: "table" }, [
        createElem(
          "thead",
          {},
          createElem(
            "tr",
            {},
            this.props.columns.map((col) => createElem("th", {}, col.title))
          )
        ),
        createElem(
          "tbody",
          {},
          this.props.data.map((row) =>
            createElem(
              "tr",
              {},
              this.props.columns.map((col) =>
                createElem("td", {}, row[col.key])
              )
            )
          )
        ),
      ]),
    ]);
  },
});
