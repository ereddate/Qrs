/**
 * 类型检查工具集
 * 提供标准类型检查和装饰器验证功能
 */
const Type = {
  /**
   * 类型检查核心方法
   * @param {*} value - 要检查的值
   * @param {string} expectedType - 期望类型
   * @returns {boolean} 是否匹配期望类型
   */
  check(value, expectedType) {
    // 处理 null 和 undefined
    if (value === null) return expectedType === "null";
    if (value === undefined) return expectedType === "undefined";

    // 内置类型映射
    const typeMap = {
      array: Array.isArray(value),
      date: value instanceof Date,
      regexp: value instanceof RegExp,
      map: value instanceof Map,
      set: value instanceof Set,
      promise: value instanceof Promise,
      function: typeof value === "function",
      object:
        typeof value === "object" && value !== null && !Array.isArray(value),
      string: typeof value === "string",
      number: typeof value === "number" && !isNaN(value),
      boolean: typeof value === "boolean",
      symbol: typeof value === "symbol",
      bigint: typeof value === "bigint",
      null: value === null,
      undefined: value === undefined,
    };

    if (Object.prototype.hasOwnProperty.call(typeMap, expectedType)) {
      return typeMap[expectedType];
    }

    // 处理基本类型
    return typeof value === expectedType;
  },

  /**
   * 方法参数和返回值类型验证装饰器
   * @param {Object} typeInfo - 类型定义 { params: Array, return: string }
   * @returns {Function} 装饰器函数
   */
  validate(typeInfo) {
    return function (target, name, descriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = function (...args) {
        // 参数类型验证
        if (typeInfo.params) {
          args.forEach((arg, index) => {
            const expectedType = typeInfo.params[index];
            if (!Type.check(arg, expectedType)) {
              throw new TypeError(
                `参数 ${index} 类型错误: 期望 ${expectedType}, 实际 ${typeof arg}`
              );
            }
          });
        }

        const result = originalMethod.apply(this, args);

        // 返回值类型验证
        if (typeInfo.return && !Type.check(result, typeInfo.return)) {
          throw new TypeError(
            `返回值类型错误: 期望 ${typeInfo.return}, 实际 ${typeof result}`
          );
        }

        return result;
      };

      return descriptor;
    };
  },
};

// 为内置对象添加类型检查方法
const extendTypeCheck = (Constructor, typeName) => {
  if (typeof Constructor.is !== "function") {
    Constructor.is = function (object) {
      return Type.check(object, typeName);
    };
  }
};

// 扩展内置对象的类型检查方法
[
  [Number, "number"],
  [String, "string"],
  [Array, "array"],
  [Object, "object"],
  [Date, "date"],
  [RegExp, "regexp"],
  [Map, "map"],
  [Set, "set"],
  [Promise, "promise"],
  [Function, "function"],
].forEach(([Ctor, type]) => extendTypeCheck(Ctor, type));

// 导出类型检查工具
export default Type;
