# Fetch 工具使用说明

## 一、核心功能
Fetch 类主要提供以下功能：
1. **拦截器管理**：支持请求拦截器和响应拦截器的添加与执行，用于统一处理请求头、响应数据等。
2. **模拟数据生成**：通过 `mock` 方法注册模拟数据，支持生成随机字符串、数字、布尔值、日期、数组及自定义对象数据。
3. **请求发送**：基于 XMLHttpRequest 实现网络请求，支持与模拟数据无缝切换。

## 二、使用步骤
### 1. 实例初始化
```javascript
import Fetch from "../../core/fetch.js";
const fetch = new Fetch(); // 创建 Fetch 实例
```

### 2. 拦截器添加
#### 请求拦截器（添加 Token）
```javascript
fetch.addRequestInterceptor(
  (config) => {
    config.headers = { ...config.headers, Authorization: "Bearer your_token_here" };
    return config;
  },
  (error) => Promise.reject(error)
);
```

#### 响应拦截器（统一处理成功/错误响应）
```javascript
fetch.addResponseInterceptor(
  (response) => (response.status === 200 ? response.data : response),
  (error) => {
    // 错误处理逻辑（如打印状态码、请求信息等）
    return Promise.reject(error);
  }
);
```

## 三、模拟数据注册
### 基础用法（生成 5 条用户数据）
```javascript
fetch.mock(
  "/api/users",
  "GET",
  { id: "number", name: "string", age: "number" },
  5 // 生成数量
);
```

### 高级用法（跳过指定字段）
若需固定某些字段（如 `isVip` 始终为 `true`），可通过 `skipFields` 配置：
```javascript
fetch.mock(
  "/api/users",
  "GET",
  { id: "number", name: "string", age: "number", isVip: true },
  5,
  ["isVip"] // 跳过生成，保留原始值
);
```

## 四、随机数据生成规则
| 类型       | 说明                                                                 | 示例参数                  |
|------------|----------------------------------------------------------------------|---------------------------|
| string     | 随机字符串（默认长度 8）                                             | (length = 8)              |
| number     | 随机整数（默认范围 0-100）                                           | (min = 0, max = 100)      |
| boolean    | 随机布尔值（真/假概率各 50%）                                        | -                         |
| date       | 随机日期（默认范围 2020-01-01 至当前时间）                           | (start, end)              |
| array      | 随机数组（默认长度 5，元素由生成器决定）                             | (length = 5, generator)   |
| object     | 按 schema 生成对象（递归调用子字段生成器）                           | { key: 生成器类型/函数 }  |

> 注：未指定类型时默认生成随机字符串。