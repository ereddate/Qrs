import { Component, createElem, Transition } from "../index.js";

const Modal = new Component({
  render() {
    return createElem(Transition, {
      show: this.props.show,
      children: [
        createElem("div", { class: "modal-mask" }, [
          createElem("div", { class: "modal-container" }, [
            createElem("div", { class: "modal-header" }, [
              this.props.title,
              createElem(
                "button",
                {
                  class: "modal-close",
                  on: { click: () => this.props.on.close?.() },
                },
                "×"
              ),
            ]),
            createElem("div", { class: "modal-body" }, this.props.children),
          ]),
        ]),
      ],
    });
  },
});
export default Modal;
