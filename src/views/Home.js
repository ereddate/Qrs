import { Component, createElem } from "../../core/index.js";
import router from "../router/index.js";
import { RouterLink } from "../../core/router.js";
const Home = new Component({
  render() {
    return createElem(
      "div",
      {},
      "Home Page",
      createElem(
        "button",
        {
          class: "btn btn-primary",
          on: {
            click: () => {
              router.push("/about");
            },
          },
        },
        "go About"
      ),
      createElem(
        RouterLink,
        { to: "/about", router, class: "btn btn-primary" },
        "go About"
      )
    );
  },
});
export default Home;
