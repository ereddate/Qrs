import { Component, createElem } from "../../core/index.js";
import router from "../router/index.js";

const About = new Component({
  render() {
    return createElem(
      "div",
      {},
      "About Page",
      createElem(
        "button",
        {
          class: "btn btn-primary",
          on: {
            click: () => {
              router.push("/");
            },
          },
        },
        "go Home"
      )
    );
  },
});
export default About;
