import { Component, createElem } from "../index.js";

const Steps = new Component({
  render() {
    const {
      active = 0,
      direction = "horizontal", // 步骤条方向，可选值：horizontal、vertical
      steps = [],
    } = this.props;

    return createElem(
      "div",
      {
        class: `steps steps--${direction}`,
      },
      steps.map((step, index) => {
        const status =
          index < active ? "finish" : index === active ? "process" : "wait";
        return createElem(
          "div",
          {
            class: `step step--${status}`,
          },
          [
            createElem(
              "div",
              {
                class: "step__head",
              },
              [
                createElem(
                  "div",
                  {
                    class: "step__icon",
                  },
                  step.icon || (status === "finish" ? "✓" : index + 1)
                ),
                createElem("div", {
                  class: "step__line",
                }),
              ]
            ),
            createElem(
              "div",
              {
                class: "step__main",
              },
              [
                createElem(
                  "div",
                  {
                    class: "step__title",
                  },
                  step.title
                ),
                step.description &&
                  createElem(
                    "div",
                    {
                      class: "step__description",
                    },
                    step.description
                  ),
              ]
            ),
          ]
        );
      })
    );
  },
});

export default Steps;
