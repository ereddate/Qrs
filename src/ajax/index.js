import Fetch from "../../core/fetch.js";

// 创建 Fetch 实例
const fetch = new Fetch();

// 添加请求拦截器
fetch.addRequestInterceptor(
  (config) => {
    // 在请求头中添加 token
    config.headers = {
      ...config.headers,
      Authorization: "Bearer your_token_here",
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// ... 已有代码 ...

// 添加响应拦截器
fetch.addResponseInterceptor(
  (response) => {
    // 统一处理成功响应
    if (response.status === 200) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // 统一处理错误响应
    if (error.response) {
      console.error(
        "请求已发出，但服务器响应状态码非 200:",
        error.response.status
      );
    } else if (error.request) {
      console.error("请求已发出，但没有收到响应:", error.request);
    } else {
      console.error("请求设置时发生错误:", error.message);
    }
    return Promise.reject(error);
  }
);
// ... 已有代码 ...

// 注册模拟数据
fetch.mock(
  "/api/users",
  "GET",
  {
    id: "number",
    name: "string",
    age: "number",
  },
  5 // 生成 5 条模拟数据
);

export default fetch;
