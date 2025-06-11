import "./typeCheck.js";

class Fetch {
  constructor() {
    this.interceptors = {
      request: [],
      response: [],
    };
    this.mockData = new Map(); // 存储模拟数据
    this.randomGenerators = {
      // 随机数据生成器
      string: (length = 8) => {
        const chars =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      },
      number: (min = 0, max = 100) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      boolean: () => Math.random() >= 0.5,
      date: (start = new Date(2020, 0, 1), end = new Date()) => {
        return new Date(
          start.getTime() + Math.random() * (end.getTime() - start.getTime())
        );
      },
      array: (length = 5, generator) => {
        return Array.from({ length }, () => generator());
      },
      object: (schema) => {
        const result = {};
        for (const key in schema) {
          result[key] = this._generateRandomData(schema[key]);
        }
        return result;
      },
    };
  }

  // 生成随机数据，跳过指定字段
  _generateRandomData(schema, skipFields = []) {
    if (typeof schema === "function") {
      return schema();
    } else if (
      typeof schema === "object" &&
      schema !== null &&
      !Array.isArray(schema)
    ) {
      const result = {};
      for (const key in schema) {
        if (skipFields.includes(key)) {
          result[key] = schema[key];
          continue; // 跳过指定字段
        }
        result[key] = this._generateRandomData(schema[key], skipFields);
      }
      return result;
    } else if (Array.isArray(schema)) {
      const [length, generator] = schema;
      if (typeof length === "number" && typeof generator === "function") {
        return Array.from({ length }, () => generator());
      }
      return Array.from({ length: length || 5 }, () =>
        this._generateRandomData(generator || "number", skipFields)
      );
    } else if (this.randomGenerators[schema]) {
      return this.randomGenerators[schema]();
    } else {
      // 默认生成随机字符串
      return this.randomGenerators.string();
    }
  }

  // 注册模拟数据
  mock(url, method, response, count = 1, skipFields = []) {
    if (Array.isArray(count)) {
      skipFields = count;
      count = 1;
    } else if (typeof response === "function") {
      count = 1;
      skipFields = [];
    }
    this.mockData.set(`${method.toUpperCase()} ${url}`, {
      response,
      count,
      skipFields,
    });
  }

  // 添加请求拦截器
  addRequestInterceptor(fulfilled, rejected) {
    this.interceptors.request.push({ fulfilled, rejected });
    // 返回移除方法
    return () => {
      this.interceptors.request = this.interceptors.request.filter(
        (i) => i.fulfilled !== fulfilled || i.rejected !== rejected
      );
    };
  }

  // 添加响应拦截器
  addResponseInterceptor(fulfilled, rejected) {
    this.interceptors.response.push({ fulfilled, rejected });
    // 返回移除方法
    return () => {
      this.interceptors.response = this.interceptors.response.filter(
        (i) => i.fulfilled !== fulfilled || i.rejected !== rejected
      );
    };
  }

  // 执行请求拦截器
  _runRequestInterceptors(config) {
    return this.interceptors.request.reduce((promise, interceptor) => {
      return promise.then(interceptor.fulfilled, interceptor.rejected);
    }, Promise.resolve(config));
  }

  // 执行响应拦截器
  _runResponseInterceptors(response) {
    return this.interceptors.response.reduce((promise, interceptor) => {
      return promise.then(interceptor.fulfilled, interceptor.rejected);
    }, Promise.resolve(response));
  }

  // 发送请求
  request(config) {
    return this._runRequestInterceptors(config)
      .then((config) => {
        // 检查是否有匹配的模拟数据
        const mockKey = `${(config.method || "GET").toUpperCase()} ${
          config.url
        }`;
        if (this.mockData.has(mockKey)) {
          const { response, count, skipFields } = this.mockData.get(mockKey);
          const data = Array.from({ length: count }, () =>
            this._generateRandomData(response, skipFields)
          );
          return Promise.resolve({
            data: count === 1 ? data[0] : data, // 如果数量为1，返回单个对象；否则返回数组
            status: 200,
            statusText: "OK",
            config,
            mock: true,
          });
        }

        // 支持 fetch API，优先使用 fetch
        if (typeof window.fetch === "function" && !config.forceXHR) {
          const fetchOptions = {
            method: config.method || "GET",
            headers: config.headers || {},
            body: config.data,
            credentials: config.credentials || "same-origin",
          };
          if (["GET", "HEAD"].includes(fetchOptions.method.toUpperCase())) {
            delete fetchOptions.body;
          }
          return window.fetch(config.url, fetchOptions).then(async (res) => {
            let responseData;
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              responseData = await res.json();
            } else if (contentType.includes("text/")) {
              responseData = await res.text();
            } else {
              responseData = await res.blob();
            }
            const response = {
              data: responseData,
              status: res.status,
              statusText: res.statusText,
              headers: res.headers,
              config,
              request: res,
            };
            return this._runResponseInterceptors(response);
          });
        }

        // 原有 XMLHttpRequest 逻辑
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(config.method || "GET", config.url, true);

          if (config.headers) {
            Object.keys(config.headers).forEach((key) => {
              xhr.setRequestHeader(key, config.headers[key]);
            });
          }

          xhr.responseType = config.responseType || "";
          xhr.timeout = config.timeout || 0;

          xhr.onload = () => {
            let responseData = xhr.response;
            // 自动解析 JSON
            if (
              xhr.getResponseHeader("content-type") &&
              xhr.getResponseHeader("content-type").includes("application/json")
            ) {
              try {
                responseData = JSON.parse(xhr.responseText);
              } catch (e) {}
            }
            const response = {
              data: responseData,
              status: xhr.status,
              statusText: xhr.statusText,
              headers: xhr.getAllResponseHeaders(),
              config: config,
              request: xhr,
            };
            this._runResponseInterceptors(response).then(resolve, reject);
          };

          xhr.onerror = () => {
            reject(new Error("Network Error"));
          };

          xhr.ontimeout = () => {
            reject(new Error("Request Timeout"));
          };

          xhr.send(config.data);
        });
      })
      .catch((error) => {
        // 支持全局错误钩子
        if (
          typeof window !== "undefined" &&
          typeof window.onFetchError === "function"
        ) {
          window.onFetchError(error);
        }
        return Promise.reject(error);
      });
  }

  // 快捷方法
  get(url, config = {}) {
    return this.request({ ...config, url, method: "GET" });
  }
  post(url, data, config = {}) {
    return this.request({ ...config, url, data, method: "POST" });
  }
  put(url, data, config = {}) {
    return this.request({ ...config, url, data, method: "PUT" });
  }
  delete(url, config = {}) {
    return this.request({ ...config, url, method: "DELETE" });
  }
  patch(url, data, config = {}) {
    return this.request({ ...config, url, data, method: "PATCH" });
  }
  head(url, config = {}) {
    return this.request({ ...config, url, method: "HEAD" });
  }
  options(url, config = {}) {
    return this.request({ ...config, url, method: "OPTIONS" });
  }
}

export default Fetch;
