import { Component, reactive, createElem } from "./index.js";

// 解析路由参数
function parseParams(path, routePath) {
  const pathSegments = path.split("/").filter(Boolean);
  const routeSegments = routePath.split("/").filter(Boolean);
  const params = {};

  routeSegments.forEach((segment, index) => {
    if (segment.startsWith(":")) {
      const paramName = segment.slice(1);
      params[paramName] = pathSegments[index];
    }
  });

  return params;
}

// 解析查询参数
function parseQuery(queryString) {
  const query = {};
  if (queryString) {
    queryString
      .substring(1)
      .split("&")
      .forEach((param) => {
        const [key, value] = param.split("=");
        query[decodeURIComponent(key)] = decodeURIComponent(value || "");
      });
  }
  return query;
}

// 定义 Router 类
class Router {
  constructor(options) {
    this.routes = options.routes || [];
    this.mode = options.mode || "hash";
    this.initialPath =
      this.mode === "hash"
        ? window.location.hash.slice(1) || "/"
        : window.location.pathname || "/";
    this.current = reactive({
      path:
        this.mode === "hash"
          ? window.location.hash.slice(1)
          : window.location.pathname,
      params: {},
      meta: {},
      query: parseQuery(window.location.search),
    });
    this.beforeEachGuards = [];
    this.beforeResolveGuards = [];
    this.afterEachHooks = [];
    this.routeGuards = {};
    this.errorHandlers = [];
    this.scrollBehavior = options.scrollBehavior;

    if (this.mode === "hash") {
      window.addEventListener("hashchange", () => {
        this.handleRouteChange(
          window.location.hash.slice(1),
          parseQuery(window.location.search)
        );
      });
    } else {
      window.addEventListener("popstate", async () => {
        const newPath = window.location.pathname;
        const newQuery = parseQuery(window.location.search);
        await this.handleRouteChange(newPath, newQuery);
      });
    }

    this.update = null;
    this.meta = options.meta || {};
  }

  init() {
    this.push(this.initialPath, parseQuery(window.location.search));
  }

  beforeEach(guard) {
    this.beforeEachGuards.push(guard);
  }

  beforeResolve(guard) {
    this.beforeResolveGuards.push(guard);
  }

  afterEach(hook) {
    this.afterEachHooks.push(hook);
  }

  onError(handler) {
    if (typeof handler === "function") {
      this.errorHandlers.push(handler);
    }
  }

  async handleRouteChange(toPath, query) {
    try {
      const fromPath = this.current.path;
      const toRoute = this.match(toPath);
      const fromRoute = this.match(fromPath);

      if (!toRoute) {
        const error = new Error(`Route not found for path: ${toPath}`);
        this._triggerError(error, { toPath, fromPath });
        return;
      }

      const params = parseParams(toPath, toRoute.path);
      const fromParams = parseParams(fromPath, fromRoute.path);

      let isNavigationCancelled = false;

      this.update && this.update(toPath);

      // 全局 beforeEach
      const globalBeforeEachResults = await Promise.all(
        this.beforeEachGuards.map(async (guard) => {
          try {
            return await guard(
              {
                path: fromPath,
                params: fromParams,
                meta: fromRoute.meta,
                query: this.current.query,
              },
              { path: toPath, params, meta: toRoute.meta, query }
            );
          } catch (error) {
            this._triggerError(error, { toPath, fromPath });
            return false;
          }
        })
      );

      for (const result of globalBeforeEachResults) {
        if (result === false) {
          isNavigationCancelled = true;
          return;
        } else if (typeof result === "string") {
          if (!isNavigationCancelled) {
            this.push(result, query);
            isNavigationCancelled = true;
          }
          return;
        }
      }

      // 路由独享 beforeEnter
      if (toRoute.beforeEnter) {
        try {
          const routeBeforeEnterResult = await toRoute.beforeEnter(
            { path: toPath, params, meta: toRoute.meta, query },
            {
              path: fromPath,
              params: fromParams,
              meta: fromRoute.meta,
              query: this.current.query,
            }
          );
          if (routeBeforeEnterResult === false) {
            isNavigationCancelled = true;
            return;
          } else if (typeof routeBeforeEnterResult === "string") {
            if (!isNavigationCancelled) {
              this.push(routeBeforeEnterResult, query);
              isNavigationCancelled = true;
            }
            return;
          }
        } catch (error) {
          this._triggerError(error, { toPath, fromPath });
          return;
        }
      }

      // 全局 beforeResolve
      const globalBeforeResolveResults = await Promise.all(
        this.beforeResolveGuards.map(async (guard) => {
          try {
            return await guard(
              {
                path: fromPath,
                params: fromParams,
                meta: fromRoute.meta,
                query: this.current.query,
              },
              { path: toPath, params, meta: toRoute.meta, query }
            );
          } catch (error) {
            this._triggerError(error, { toPath, fromPath });
            return false;
          }
        })
      );

      for (const result of globalBeforeResolveResults) {
        if (result === false) {
          isNavigationCancelled = true;
          return;
        } else if (typeof result === "string") {
          if (!isNavigationCancelled) {
            this.push(result, query);
            isNavigationCancelled = true;
          }
          return;
        }
      }

      if (!isNavigationCancelled) {
        this.current.path = toPath;
        this.current.params = params;
        this.current.meta = toRoute.meta;
        this.current.query = query;
        // 支持滚动行为
        if (typeof this.scrollBehavior === "function") {
          setTimeout(() => {
            this.scrollBehavior({ to: toRoute, from: fromRoute });
          }, 0);
        }
      }

      this.afterEachHooks.forEach((hook) => {
        try {
          hook(
            {
              path: fromPath,
              params: fromParams,
              meta: fromRoute.meta,
              query: this.current.query,
            },
            { path: toPath, params, meta: toRoute.meta, query }
          );
        } catch (error) {
          this._triggerError(error, { toPath, fromPath });
        }
      });
    } catch (error) {
      this._triggerError(error, { toPath, fromPath: this.current.path });
    }
  }

  _triggerError(error, info) {
    if (this.errorHandlers.length) {
      this.errorHandlers.forEach((handler) => handler(error, info));
    } else {
      console.error("Router error:", error, info);
    }
  }

  match(path) {
    let matchedRoute = this.routes.find((route) => {
      if (route.alias && route.alias === path) {
        return true;
      }
      const routeSegments = route.path.split("/").filter(Boolean);
      const pathSegments = path.split("/").filter(Boolean);

      if (routeSegments.length !== pathSegments.length) {
        return false;
      }

      for (let i = 0; i < routeSegments.length; i++) {
        if (
          !routeSegments[i].startsWith(":") &&
          routeSegments[i] !== pathSegments[i]
        ) {
          return false;
        }
      }
      return true;
    });

    return matchedRoute || this.routes.find((route) => route.path === "*");
  }

  matchByName(name) {
    return this.routes.find((route) => route.name === name);
  }

  async push(pathOrName, query = {}) {
    let path;
    if (typeof pathOrName === "string") {
      path = pathOrName;
    } else if (typeof pathOrName === "object" && pathOrName.name) {
      const route = this.matchByName(pathOrName.name);
      if (route) {
        path = route.path;
        if (pathOrName.params) {
          Object.entries(pathOrName.params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, value);
          });
        }
      } else {
        throw new Error(`Route with name ${pathOrName.name} not found`);
      }
    }
    const queryString = Object.entries(query)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");
    const fullPath = queryString ? `${path}?${queryString}` : path;
    await this.handleRouteChange(path, query);
    if (this.mode === "hash") {
      window.location.hash = fullPath;
    } else {
      window.history.pushState({}, "", fullPath);
    }
  }

  async replace(pathOrName, query = {}) {
    let path;
    if (typeof pathOrName === "string") {
      path = pathOrName;
    } else if (typeof pathOrName === "object" && pathOrName.name) {
      const route = this.matchByName(pathOrName.name);
      if (route) {
        path = route.path;
        if (pathOrName.params) {
          Object.entries(pathOrName.params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, value);
          });
        }
      } else {
        throw new Error(`Route with name ${pathOrName.name} not found`);
      }
    }
    const queryString = Object.entries(query)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");
    const fullPath = queryString ? `${path}?${queryString}` : path;
    await this.handleRouteChange(path, query);
    if (this.mode === "hash") {
      window.location.replace(`#${fullPath}`);
    } else {
      window.history.replaceState({}, "", fullPath);
    }
  }

  // 类似 vue-router 的 go 方法，在浏览器历史记录中前进或后退指定数量的步骤
  go(steps) {
    if (typeof steps !== "number") {
      console.error("go 方法需要传入一个数字类型的参数");
      return;
    }
    window.history.go(steps);
  }

  // 类似 vue-router 的 back 方法，在浏览器历史记录中后退一步
  back() {
    this.go(-1);
  }

  // 类似 vue-router 的 forward 方法，在浏览器历史记录中前进一步
  forward() {
    this.go(1);
  }

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
      isLeaving: false,
      error: null,
    };
  },
  async created() {
    try {
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
            that.isLeaving = true;
            that.update();

            that.prevComponent = that.currentComponent;
            that.currentComponent = matchedRoute.component;
            that.isLeaving = false;
            that.isEntering = true;
            that.update();

            setTimeout(() => {
              that.isEntering = false;
            }, 300);
          }
        });
      // 错误处理
      this.props.router?.onError((err) => {
        that.error = err;
        that.update();
      });
    } catch (err) {
      this.error = err;
    }
  },
  render() {
    if (this.error) {
      return createElem("div", { class: "router-error" }, String(this.error));
    }
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
      type: [String, Object],
      required: true,
    },
    replace: {
      type: Boolean,
      default: false,
    },
    class: {
      type: [String, Array, Object],
      default: "router-link",
    },
    activeClass: {
      type: String,
      default: "router-link-active",
    },
    exact: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    isActive() {
      const currentPath = this.props.router?.current?.path;
      if (!currentPath) return false;
      if (this.props.exact) {
        return currentPath === this.targetPath;
      }
      return currentPath.startsWith(this.targetPath);
    },
    linkClass() {
      let base = this.props.class || "router-link";
      if (this.isActive) {
        if (typeof base === "string") {
          return `${base} ${this.props.activeClass}`;
        }
        if (Array.isArray(base)) {
          return [...base, this.props.activeClass];
        }
        if (typeof base === "object") {
          return { ...base, [this.props.activeClass]: true };
        }
      }
      return base;
    },
    targetPath() {
      if (typeof this.props.to === "string") {
        return this.props.to;
      } else if (typeof this.props.to === "object" && this.props.to.name) {
        const route = this.props.router?.matchByName(this.props.to.name);
        if (route) {
          let path = route.path;
          if (this.props.to.params) {
            Object.entries(this.props.to.params).forEach(([key, value]) => {
              path = path.replace(`:${key}`, value);
            });
          }
          return path;
        }
      }
      return "#";
    },
  },
  render() {
    const path = this.targetPath;
    const href = this.props?.router?.mode === "hash" ? `#${path}` : path;
    return createElem(
      "a",
      {
        class: this.linkClass,
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
              window.location.href = path;
            }
          },
        },
      },
      this.$slots.default
    );
  },
});

export { Router, RouterView, RouterLink };
