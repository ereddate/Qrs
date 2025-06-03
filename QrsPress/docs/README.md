# 项目简介
`Qrs`是一个轻量级的纯 JavaScript 前端框架，提供了虚拟 DOM、组件化开发、响应式数据绑定、异步组件支持、路由管理、状态管理、AJAX、MOCK、事件总线等功能，同时支持服务端渲染和插槽功能，并提供UI样式库及对应的22个js组件、微应用支持。

## 功能说明
### 核心模块
- `index.js`：导出了多个重要的功能和变量，如 `Component`、`reactive`、`createElem` 等。
- `router.js`：引入 `index.js` 中的部分功能，用于路由管理。
- `store.js`：用于状态管理。
- `fetch.js`：用于网络请求。
- `dom.js`：用于dom的操作，类似`jQuery`，并可在`dom<=>Component`和`dom<=>VNode`间切换。
- `typeCheck.js`：用于类型检查。
- `microApp.js`：提供微应用功能, 示例在examples\microApp下。
- `ui/base.scss`：提供了基础的样式文件。
- `components/*.js`：提供了多个组件。


### 主要功能
- **响应式系统**：通过 `reactive` 函数实现数据的响应式。
- **元素创建**：使用 `createElem` 函数创建 DOM 元素。
- **组件化开发**：提供 `Component` 类支持组件化开发。
- **应用创建**：`createApp` 函数用于创建应用实例。

## 使用方法
### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建项目
```bash
npm run build
```

## 项目结构
```
├── core/
│   ├── dom.js
│   ├── index.js
│   ├── fetch.js
│   ├── index.js
│   ├── router.js
│   ├── store.js
│   ├── typeCheck.js
│   └── ui/
│   │   └── base.scss
│   └── components/
│       └── Button.js
│       └── ...
├── dist/
├── index.html
├── main.js
├── node_modules/
├── package-lock.json
├── package.json
├── src/
└── vite.config.js
```

## js组件列表
```
  Button,
  Card,
  Input,
  Modal,
  Nav,
  Pagination,
  Select,
  Tag,
  Progress,
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
```
- 使用`core/components/index.js`引入使用，简单示例在`main.js`中。

## 注意事项
- 全部使用说明在`/docs`目录下。
- 请确保 Node.js 环境已正确安装。
- 开发过程中可根据需要修改 `vite.config.js` 配置文件。