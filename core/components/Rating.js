import { reactive, Component, createElem } from "../index.js";

export default new Component({
  data() {
    return {
      hoverRating: 0,
      selectedRating: this.props.value || 0,
    };
  },
  render() {
    return createElem(
      "div",
      { class: "rating" },
      [1, 2, 3, 4, 5].map((star) =>
        createElem(
          "span",
          {
            class: `star ${
              star <= (this.data.hoverRating || this.data.selectedRating)
                ? "active"
                : ""
            }`,
            on: {
              click: () => {
                this.data.selectedRating = star;
                this.props.on.change?.(star);
              },
              mouseover: () => (this.data.hoverRating = star),
              mouseout: () => (this.data.hoverRating = 0),
            },
          },
          "★"
        )
      )
    );
  },
});
