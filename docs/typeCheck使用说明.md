# typeCheck.js 使用说明

## 一、工具简介
`typeCheck.js` 是一个类型检查工具集，提供标准类型检查方法、参数/返回值验证装饰器，以及为内置对象扩展的类型检查方法。

## 二、核心方法说明
### 1. `check(value, expectedType)`：类型检查核心方法
- **功能**：检查值 `value` 是否符合期望类型 `expectedType`。
- **参数**：
  - `value`：要检查的值（任意类型）。
  - `expectedType`：期望类型（字符串，如 `'number'`、`'array'`、`'date'` 等）。
- **返回值**：布尔值（`true` 表示类型匹配，`false` 表示不匹配）。
- **示例**：
  ```javascript
  import Type from '../core/typeCheck.js';

  console.log(Type.check(null, 'null')); // true
  console.log(Type.check(undefined, 'undefined')); // true
  console.log(Type.check([1,2,3], 'array')); // true
  console.log(Type.check(new Date(), 'date')); // true
  ```

### 2. `validate(typeInfo)`：参数/返回值验证装饰器
- **功能**：装饰函数，验证入参和返回值的类型。
- **参数**：
  - `typeInfo`：类型定义对象（`{ params: Array, return: string }`）。
    - `params`：参数类型数组（按参数顺序指定类型，如 `['number', 'string']`）。
    - `return`：返回值类型（如 `'boolean'`）。
- **示例**：
  ```javascript
  class UserService {
    @Type.validate({ params: ['string', 'number'], return: 'boolean' })
    static createUser(name, age) {
      return typeof name === 'string' && typeof age === 'number';
    }
  }

  // 参数类型错误会抛出异常
  UserService.createUser(123, '20'); // 抛出 TypeError: 参数 0 类型错误: 期望 string, 实际 number
  ```

## 三、内置对象扩展方法
工具为常用内置对象扩展了 `is` 方法，直接通过构造函数调用，用于快速判断对象类型。

| 内置对象 | 方法          | 说明                     | 示例                     |
|----------|---------------|--------------------------|--------------------------|
| Number   | `Number.is()` | 判断是否为数字类型       | `Number.is(123)` → true  |
| String   | `String.is()` | 判断是否为字符串类型     | `String.is('test')` → true|
| Array    | `Array.is()`  | 判断是否为数组类型       | `Array.is([1,2])` → true |
| Date     | `Date.is()`   | 判断是否为Date实例       | `Date.is(new Date())` → true |
| ...      | ...           | 其他对象类似（RegExp、Map等） | `RegExp.is(/\d+/)` → true |

## 四、注意事项
- `check` 方法对 `null` 和 `undefined` 需显式传入 `'null'` 或 `'undefined'` 作为期望类型。
- `validate` 装饰器依赖 `this.check`，需确保装饰器在类方法上下文中使用。
- 扩展的 `is` 方法本质是调用 `Type.check`，与原生 `Array.isArray` 等方法兼容。