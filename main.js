import { reactive, createElem, Component, createApp } from "./core/index.js";
import "./core/ui/base.scss";
import store from "./src/store/index.js";
import fetch from "./src/ajax/index.js";
import { RouterView } from "@/core/router.js";
import router from "./src/router/index.js";

// 发送 GET 请求
fetch
  .request({
    method: "GET",
    url: "/api/users",
  })
  .then((data) => {
    console.log("请求成功，数据:", data);
  })
  .catch((error) => {
    console.error("请求失败:", error);
  });

// 发送 POST 请求
fetch
  .request({
    method: "POST",
    url: "/api/login",
    data: {
      username: "testuser",
      password: "testpassword",
    },
    headers: {
      "Content-Type": "application/json",
    },
  })
  .then((data) => {
    console.log("登录成功，数据:", data);
  })
  .catch((error) => {
    console.error("登录失败:", error);
  });

const state = reactive({ count: 0 }, (key, oldValue, newValue) => {
  console.log("state updated", key, oldValue, newValue);
});

const el = new Component({
  data() {
    return {
      count: 0,
    };
  },
  computed: {
    countTip() {
      return `<${this.data.count}>`;
    },
  },
  watch: {
    countTip: function (oldValue, newValue) {
      console.log(`从 ${oldValue} 变为 ${newValue}`);
    },
  },
  render() {
    return createElem(
      "div",
      { class: "compute card" },
      `countTip count:${this.data.countTip}`,
      `data count:${this.data.count}`,
      `state count:${state.count}`,
      `store count:${store.state.count}`,
      createElem(
        "button",
        {
          class: "btn btn-primary",
          style: {
            cursor: "pointer",
            marginLeft: "1rem",
          },
          on: {
            click: () => {
              state.count++;
              this.data.count++;
              store.commit("increment");
              console.log(this.data.count);
            },
          },
        },
        "click me"
      )
    );
  },
  created() {
    console.log("created");
  },
});

const App = new Component({
  render() {
    return createElem(
      "div",
      { class: "app container" },
      createElem(RouterView, { router }),
      el,
      createElem(el, {
        updated() {
          console.log("updated");
        },
      })
    );
  },
});

createApp(App).mount("#app");
