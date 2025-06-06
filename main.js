import {
  reactive,
  createElem,
  Component,
  createApp,
  Transition,
} from "./core/index.js";
import "./core/ui/base.scss";
import store from "./src/store/index.js";
import fetch from "./src/ajax/index.js";
import { RouterView } from "@/core/router.js";
import router from "./src/router/index.js";
import Dom from "./core/dom.js";
import {
  Button,
  Card,
  Input,
  Nav,
  Select,
  Pagination,
  Tag,
  Table,
  Message,
  DatePicker,
  Upload,
  Rating,
  TimePicker,
  ColorPicker,
  Switch,
  Toast,
  Spinner,
  Tabs,
  Notification,
  Loading,
  Stepper,
  Slider,
  Search,
  Radio,
  Dialog,
} from "./core/components";

const dom = new Dom("body");
const testP = document.createElement("p");
dom.append(testP).find(testP).html("Hello World");
const pComponent = new Dom(testP)
  .clone()
  .html("Hello World[toComponent]")
  .toComponent();

const newDom = dom.fromComponent(pComponent);
newDom.clone().html("Hello World[fromComponent]").appendTo("body");

console.log(pComponent, newDom);

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

// 创建 Transition 组件
const MyTransition = new Transition({
  show: true,
  css: true,
  onBeforeEnter(el) {
    console.log("进入前", el);
  },
  onEnter(el, done) {
    console.log("进入中", el);
    setTimeout(done, 300); // 动画持续时间
  },
  onAfterEnter(el) {
    console.log("进入后", el);
  },
  onBeforeLeave(el) {
    console.log("离开前", el);
  },
  onLeave(el, done) {
    console.log("离开中", el);
    setTimeout(done, 300); // 动画持续时间
  },
  onAfterLeave(el) {
    console.log("离开后", el);
  },
  children: [
    createElem(
      "div",
      {
        class: "box",
        style: {
          transition: "all 0.3s ease", // 确保元素本身也有过渡属性
        },
      },
      "过渡动画内容"
    ),
  ],
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
  data() {
    return {
      selectedValue: "option1",
      dialogVisible: false,
    };
  },
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
      }),
      MyTransition,
      pComponent,
      `<h1>Components Demo:</h1>`,
      `<h2>Button demo:</h2>`,
      createElem(Button, {
        type: "primary",
        text: "点击我",
        on: {
          click: () => console.log("按钮点击"),
        },
      }),
      `<h2>Card demo:</h2>`,
      createElem(Card, {
        title: "卡片标题",
        children: "卡片内容",
      }),
      `<h2>Input demo:</h2>`,
      createElem(Input, {
        placeholder: "请输入...",
        on: { change: (val) => console.log(val) },
      }),
      `<h2>Nav demo:</h2>`,
      createElem(Nav, {
        items: [
          { text: "首页", value: "home" },
          { text: "关于", value: "about" },
        ],
        on: { change: (item) => console.log(item) },
      }),
      `<h2>Select demo:</h2>`,
      createElem(Select, {
        options: [
          { text: "选项1", value: 1 },
          { text: "选项2", value: 2 },
        ],
        on: { change: (option) => console.log(option) },
      }),
      `<h2>Pagination demo:</h2>`,
      createElem(Pagination, {
        total: 100,
        pageSize: 10,
        on: { change: (page) => console.log(page) },
      }),
      `<h2>Tag demo:</h2>`,
      createElem(Tag, {
        type: "primary",
        text: "重要",
        on: {
          click: () => {
            console.log("tag click!");
          },
        },
      }),
      `<h2>Table demo:</h2>`,
      createElem(Table, {
        columns: [
          { title: "姓名", key: "name" },
          { title: "年龄", key: "age" },
        ],
        data: [
          { name: "张三", age: 25 },
          { name: "李四", age: 30 },
        ],
      }),
      `<h2>DatePicker demo:</h2>`,
      createElem(DatePicker, {
        on: { change: (date) => console.log(date) },
      }),
      `<h2>Upload demo:</h2>`,
      createElem(Upload, {
        on: { change: (file) => console.log(file) },
      }),
      `<h2>Rating demo:</h2>`,
      createElem(Rating, {
        value: 3,
        on: { change: (rating) => console.log(rating) },
      }),
      `<h2>TimePicker demo:</h2>`,
      createElem(TimePicker, {
        on: { change: (time) => console.log(time) },
      }),
      `<h2>ColorPicker demo:</h2>`,
      createElem(ColorPicker, {
        on: { change: (color) => console.log(color) },
      }),
      `<h2>Switch demo:</h2>`,
      createElem(Switch, {
        on: { change: (isActive) => console.log(isActive) },
      }),
      `<h2>Spinner demo:</h2>`,
      createElem(Spinner),
      `<h2>Tabs demo:</h2>`,
      createElem(Tabs, {
        tabs: [
          { title: "标签1", content: "内容1" },
          { title: "标签2", content: "内容2" },
        ],
      }),
      `<h2>Stepper demo:</h2>`,
      createElem(Stepper, {
        value: 5, // 初始值
        min: 0, // 最小值
        max: 10, // 最大值
        step: 1, // 步长
        on: {
          change: (value) => {
            console.log("当前数值为:", value);
          },
        },
      }),
      `<h2>Slider demo:</h2>`,
      createElem(Slider, {
        value: 50, // 初始值
        min: 0, // 最小值
        max: 100, // 最大值
        step: 5, // 步长
        on: {
          change: (value) => {
            console.log("当前值为:", value);
          },
        },
      }),
      `<h2>Search demo:</h2>`,
      createElem(Search, {
        placeholder: "请输入商品名称",
        showCancel: true,
        cancelText: "取消",
        on: {
          input: (value) => {
            console.log("输入内容:", value);
          },
          search: (value) => {
            console.log("开始搜索:", value);
          },
          clear: () => {
            console.log("输入内容已清空");
          },
          cancel: () => {
            console.log("已取消搜索");
          },
        },
      }),
      `<h2>Radio demo:</h2>`,
      createElem(Radio, {
        label: "选项1",
        value: "option1",
        checked: this.data.selectedValue === "option1",
        on: {
          change: (checked, value) => {
            if (checked) {
              this.data.selectedValue = value;
              console.log("选中值:", value);
            }
          },
        },
      }),
      createElem(Radio, {
        label: "选项2",
        value: "option2",
        checked: this.data.selectedValue === "option2",
        on: {
          change: (checked, value) => {
            if (checked) {
              this.data.selectedValue = value;
              console.log("选中值:", value);
            }
          },
        },
      }),
      `<h2>Dialog demo:</h2>`,
      createElem(
        "button",
        {
          class: "show-dialog-btn",
          on: {
            click: () => {
              this.data.dialogVisible = this.data.dialogVisible ? false : true;
            },
          },
        },
        "显示对话框"
      ),
      createElem(Dialog, {
        visible: this.data.dialogVisible,
        title: "提示",
        content: "确认要执行此操作吗？",
        showCancelButton: true,
        on: {
          confirm: () => {
            this.data.dialogVisible = false;
            console.log("用户点击了确认");
          },
          cancel: () => {
            this.data.dialogVisible = false;
            console.log("用户点击了取消");
          },
        },
      })
    );
  },
});

createApp(App).mount("#app");

// 使用消息提示
Message.show({
  type: "success",
  content: "Message操作成功",
  duration: 2000,
});

// 使用Toast
Toast.show({
  type: "success",
  message: "Toast操作成功",
  duration: 3000,
  position: "bottom-right",
});

// 使用通知组件
Notification.show({
  type: "success",
  message: "Notification操作成功",
  duration: 3000,
});

// 使用加载组件
const loading = Loading.show();
setTimeout(() => {
  loading();
}, 2000);
