import { Component, reactive, createElem } from "./index.js";

// 定义 Router 类
class Router {
  constructor(options) {
    this.routes = options.routes || [];
    // 新增模式属性，默认为 history
    this.mode = options.mode || "hash";
    // 初始化时获取当前路径，如果没有路径则默认使用 "/"
    this.initialPath =
      this.mode === "hash"
        ? window.location.hash.slice(1) || "/"
        : window.location.pathname || "/";
    this.current = reactive({
      path:
        this.mode === "hash"
          ? window.location.hash.slice(1)
          : window.location.pathname,
    });
    // 存储全局前置守卫
    this.beforeEachGuards = [];
    // 存储全局后置钩子
    this.afterEachHooks = [];

    // 根据模式监听不同事件
    if (this.mode === "hash") {
      window.addEventListener("hashchange", () => {
        this.handleRouteChange(window.location.hash.slice(1));
      });
    } else {
      window.addEventListener("popstate", () => {
        this.handleRouteChange(window.location.pathname);
      });
    }

    this.update = null;
    // 新增路由元信息支持
    this.meta = options.meta || {};
  }

  init() {
    this.push(this.initialPath);
  }

  // 添加全局前置守卫
  beforeEach(guard) {
    this.beforeEachGuards.push(guard);
  }

  // 添加全局后置钩子
  afterEach(hook) {
    this.afterEachHooks.push(hook);
  }

  // 处理路由变化，包含路由守卫逻辑
  async handleRouteChange(toPath) {
    try {
      const fromPath = this.current.path;
      const toRoute = this.match(toPath);
      const fromRoute = this.match(fromPath);

      // 新增导航取消标志
      let isNavigationCancelled = false;

      this.update && this.update(toPath);

      // 并行执行全局前置守卫
      const guardResults = await Promise.all(
        this.beforeEachGuards.map(async (guard) => {
          try {
            return await guard(fromRoute, toRoute);
          } catch (error) {
            console.error("Route guard error:", error);
            return false;
          }
        })
      );

      for (const result of guardResults) {
        if (result === false) {
          isNavigationCancelled = true;
          return;
        } else if (String.is(result)) {
          if (!isNavigationCancelled) {
            this.push(result);
            isNavigationCancelled = true;
          }
          return;
        }
      }

      if (!isNavigationCancelled) {
        this.current.path = toPath;
      }

      // 执行全局后置钩子
      this.afterEachHooks.forEach((hook) => {
        try {
          hook(fromRoute, toRoute);
        } catch (error) {
          console.error("Route hook error:", error);
        }
      });
    } catch (error) {
      console.error("Route change error:", error);
    }
  }

  // 路由匹配方法，支持 404 路由
  match(path) {
    const matchedRoute = this.routes.find((route) => route.path === path);
    return matchedRoute || this.routes.find((route) => route.path === "*");
  }

  // 编程式导航：push 方法
  async push(path) {
    await this.handleRouteChange(path);
    if (this.mode === "hash") {
      window.location.hash = path;
    } else {
      window.history.pushState({}, "", path);
    }
  }

  // 编程式导航：replace 方法
  async replace(path) {
    await this.handleRouteChange(path);
    if (this.mode === "hash") {
      window.location.replace(`#${path}`);
    } else {
      window.history.replaceState({}, "", path);
    }
  }

  // 路由懒加载方法
  static lazyLoad(componentImport) {
    return {
      async render() {
        const { default: Component } = await componentImport();
        return new Component().render();
      },
    };
  }
}

// 定义 RouterView 组件，支持过渡动画
const RouterView = new Component({
  data() {
    return {
      currentComponent: null,
      prevComponent: null,
      isEntering: false,
      // 新增过渡动画状态
      isLeaving: false,
    };
  },
  async created() {
    this.props.router?.init();
    const matchedRoute = this.props.router?.match(
      this.props.router?.current.path || this.initialPath
    );
    if (matchedRoute) {
      this.currentComponent = matchedRoute.component;
    }
    const that = this;
    this.props.router &&
      (this.props.router.update = (toPath) => {
        const matchedRoute = that.props.router?.match(toPath);
        if (matchedRoute) {
          // 开始离开动画
          that.isLeaving = true;
          that.update();

          that.prevComponent = that.currentComponent;
          that.currentComponent = matchedRoute.component;
          that.isLeaving = false;
          that.isEntering = true;
          that.update();

          // 等待进入动画完成
          setTimeout(() => {
            that.isEntering = false;
          }, 300);
        }
      });
  },
  render() {
    if (this.isLeaving && this.prevComponent) {
      return createElem(this.prevComponent, { class: "route-leave" });
    }
    if (this.isEntering && this.currentComponent) {
      return createElem(this.currentComponent, { class: "route-enter" });
    }
    if (this.currentComponent) {
      return createElem(this.currentComponent);
    }
    return createElem("div", {}, "Not Found");
  },
});

// 定义 router-link 组件
const RouterLink = new Component({
  props: {
    to: {
      type: String,
      required: true,
    },
    replace: {
      type: Boolean,
      default: false,
    },
  },
  render() {
    const href =
      this.props?.router?.mode === "hash" ? `#${this.props.to}` : this.props.to;
    return createElem(
      "a",
      {
        class: this.props?.class || "router-link",
        href,
        on: {
          click: (event) => {
            event.preventDefault();
            const router = this.props?.router;
            if (router) {
              if (this.props.replace) {
                router.replace(this.props.to);
              } else {
                router.push(this.props.to);
              }
            } else {
              window.location.href = this.props.to;
            }
          },
        },
      },
      // 渲染子元素
      this.$slots.default
    );
  },
});

export { Router, RouterView, RouterLink };
