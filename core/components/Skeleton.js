import { Component, createElem } from "../index.js";

const Skeleton = new Component({
  render() {
    const {
      title = false,
      paragraph = 3,
      avatar = false,
      animated = true,
      round = false,
    } = this.props;

    const skeletonClass = ["skeleton", animated ? "skeleton--animated" : ""];

    return createElem(
      "div",
      {
        class: skeletonClass.filter(Boolean).join(" "),
      },
      [
        avatar &&
          createElem("div", {
            class: `skeleton__avatar ${round ? "skeleton__avatar--round" : ""}`,
          }),
        createElem(
          "div",
          {
            class: "skeleton__content",
          },
          [
            title &&
              createElem("div", {
                class: `skeleton__title ${
                  round ? "skeleton__title--round" : ""
                }`,
              }),
            typeof paragraph === "number"
              ? Array.from({ length: paragraph }).map((_, index) =>
                  createElem("div", {
                    class: `skeleton__paragraph-line ${
                      round ? "skeleton__paragraph-line--round" : ""
                    }`,
                    style: {
                      width: index === paragraph - 1 ? "60%" : "100%",
                    },
                  })
                )
              : null,
          ]
        ),
      ].filter(Boolean)
    );
  },
});

export default Skeleton;
