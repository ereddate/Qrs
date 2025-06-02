import { Component, createElem } from "../index.js";

const Loading = new Component({
  render() {
    return createElem("div", { class: "loading-overlay" }, [
      createElem("div", { class: "loading-spinner" }),
    ]);
  },
});

// 静态方法
Loading.show = () => {
  const loading = new Loading.constructor({ ...Loading.props });
  const el = loading.render();
  document.body.appendChild(el);
  return () => el.remove();
};

export default Loading;
