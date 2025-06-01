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
      boolean: () => {
        return Math.random() >= 0.5;
      },
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
    if (Function.is(schema)) {
      return schema();
    } else if (Object.is(schema) && !Array.isArray(schema)) {
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
      if (String.is(length) && Function.is(generator)) {
        const re = generator();
        return Number.is(re)
          ? re
          : this._generateRandomData(generator, skipFields);
      }
      return Array.from({ length }, () =>
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
  mock(url, method, response, count, skipFields = []) {
    if (Array.isArray(count)) {
      skipFields = count;
      count = 1;
    } else if (Function.is(response)) {
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
  }

  // 添加响应拦截器
  addResponseInterceptor(fulfilled, rejected) {
    this.interceptors.response.push({ fulfilled, rejected });
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
        const mockKey = `${config.method.toUpperCase()} ${config.url}`;
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
          });
        }

        // 原有请求逻辑
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(config.method || "GET", config.url, true);

          if (config.headers) {
            Object.keys(config.headers).forEach((key) => {
              xhr.setRequestHeader(key, config.headers[key]);
            });
          }

          xhr.onload = () => {
            const response = {
              data: xhr.response,
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

          xhr.send(config.data);
        });
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  }
}

export default Fetch;
