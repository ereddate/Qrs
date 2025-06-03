# Dom 类使用说明

## 概述
Dom 类是一个轻量级的DOM操作封装库，提供了从DOM查询、样式/属性操作、事件处理到动画效果的全流程操作方法，同时支持与组件（Component）和虚拟节点（VNode）的交互。

---

## 核心功能与方法

### 一、DOM查询
通过构造函数或查询方法快速定位元素：
- `constructor(selector)`：支持选择器字符串、HTMLElement、Dom实例初始化
- `find(selector)`：查找当前元素的子元素（返回单个Dom实例）
- `findAll(selector)`：查找当前元素的所有子元素（返回Dom实例数组）

**示例**：
```javascript
// 通过选择器初始化
const container = new Dom('#app');
// 查找子元素
const title = container.find('.title');
// 查找所有列表项
const listItems = container.findAll('.list-item');
```

### 二、样式与类操作
灵活控制元素样式和CSS类：
- `css(styles)`：批量设置样式（如`{ color: 'red', fontSize: '16px' }`）
- `hasClass(className)`/`addClass(className)`/`removeClass(className)`/`toggleClass(className)`：类名管理

**示例**：
```javascript
// 设置背景色并添加高亮类
title.css({ backgroundColor: '#f0f0f0' }).addClass('highlight');
```

### 三、属性与数据操作
操作HTML属性和data-*属性：
- `attr(name, [value])`：获取/设置属性（如`attr('data-id', '123')`）
- `data(key, [value])`：JSON序列化存储数据（自动处理`data-*`属性）

**示例**：
```javascript
// 设置自定义数据
title.data('user', { name: '张三', age: 25 });
// 获取数据
const user = title.data('user'); // { name: '张三', age: 25 }
```

### 四、事件处理
支持普通事件绑定和事件委托：
- `on(event, [selector], handler)`：
  - 无selector时直接绑定事件（如`on('click', handleClick)`）
  - 有selector时启用委托（如`on('click', '.btn', handleBtnClick)`）
- `off(event, [handler])`：移除事件监听

**示例**（事件委托）：
```javascript
// 列表容器委托点击事件到列表项
container.on('click', '.list-item', (e) => {
  console.log('点击列表项：', e.target.textContent);
});
```

### 五、DOM结构操作
增删改查DOM节点：
- `append(child)`/`prepend(child)`：追加/前置子节点（支持Dom实例、HTMLElement、文本）
- `before(newNode)`/`after(newNode)`：在当前元素前后插入节点
- `remove()`/`empty()`：移除自身/清空子节点

**示例**（动态添加列表项）：
```javascript
// 创建新列表项并追加到容器
const newItem = new Dom(document.createElement('li'));
newItem.html('新列表项').addClass('list-item');
container.append(newItem);
```

### 六、动画效果
提供基础的过渡和动画方法：
- `transition(properties, duration, easing)`：CSS过渡（自动生成transition属性）
- `animate(properties, duration, easing, complete)`：逐帧动画（支持线性、缓入、缓出等效果）

**示例**（淡入动画）：
```javascript
// 元素淡入（透明度从0到1，持续500ms）
newItem.animate({ opacity: 1 }, 500, 'ease-in', () => {
  console.log('动画完成');
});
```

---

## 与组件/虚拟节点的交互
Dom类支持与框架核心组件（Component）和虚拟节点（VNode）的转换，实现声明式与命令式操作的结合：
- `toComponent()`：将当前Dom元素转换为组件（`render`返回该元素）
- `toVNode()`：将当前Dom元素转换为虚拟节点（递归转换子节点）
- `static fromVNode(vnode)`：从虚拟节点渲染为Dom实例

**示例**（Dom转组件）：
```javascript
// 将现有DOM元素封装为组件
const domComponent = new Dom('#existing-element').toComponent();
// 在其他组件中使用
new ParentComponent().render().append(domComponent.render());
```

## 注意事项
- 所有方法均返回`this`，支持链式调用（如`dom.css().addClass().append()`）
- 操作前建议通过`isVisible()`检查元素是否可见，避免无效操作
- 动画队列通过`_animationQueue`管理，可通过`stop(clearQueue)`控制播放