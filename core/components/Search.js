import { Component, createElem } from "../index.js";

const Search = new Component({
  // 初始化数据
  data() {
    return {
      inputValue: this.props.value || "",
    };
  },
  render() {
    const {
      placeholder = "请输入搜索内容",
      showCancel = false,
      cancelText = "取消",
      disabled = false,
    } = this.props;

    return createElem(
      "div",
      {
        class: `search ${disabled ? "disabled" : ""}`,
      },
      [
        // 搜索框容器
        createElem(
          "div",
          {
            class: "search__input-container",
          },
          [
            // 搜索图标
            createElem("div", {
              class: "search__icon iconfont icon-search",
            }),
            // 输入框
            createElem("input", {
              class: "search__input",
              type: "text",
              placeholder,
              value: this.data.inputValue,
              disabled,
              on: {
                change: (e) => {
                  this.data.inputValue = e.target.value;
                  this.props.on.input?.(e.target.value);
                },
                keydown: (e) => {
                  if (e.key === "Enter") {
                    this.props.methods.handleSearch.bind(this)();
                  }
                },
              },
            }),
            // 清空按钮
            createElem("div", {
              class: "search__clear iconfont icon-close",
              on: {
                click: () => {
                  this.data.inputValue = "";
                  this.props.on.clear?.();
                },
              },
            }),
          ]
        ),
        // 取消按钮
        showCancel && !disabled
          ? createElem(
              "button",
              {
                class: "search__cancel",
                on: {
                  click: () => {
                    this.data.inputValue = "";
                    this.props.on.cancel?.();
                  },
                },
              },
              cancelText
            )
          : null,
      ]
    );
  },
  methods: {
    // 处理搜索事件
    handleSearch() {
      this.props.on.search?.(this.data.inputValue);
    },
  },
});

export default Search;
