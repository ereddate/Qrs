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
    // 处理null和undefined
    if (value === null) return expectedType === "null";
    if (value === undefined) return expectedType === "undefined";

    // 处理内置对象类型
    const typeMap = {
      array: Array.isArray(value),
      date: value instanceof Date,
      regexp: value instanceof RegExp,
      map: value instanceof Map,
      set: value instanceof Set,
      promise: value instanceof Promise,
      function: typeof value === "function",
      object: typeof value === "object" && !Array.isArray(value),
      string: typeof value === "string",
      number: typeof value === "number" && !isNaN(value),
      boolean: typeof value === "boolean",
      symbol: typeof value === "symbol",
      bigint: typeof value === "bigint",
      null: value === null,
      undefined: value === undefined,
    };

    if (typeMap.hasOwnProperty(expectedType)) {
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
            if (!this.check(arg, expectedType)) {
              throw new TypeError(
                `参数 ${index} 类型错误: 期望 ${expectedType}, 实际 ${typeof arg}`
              );
            }
          });
        }

        const result = originalMethod.apply(this, args);

        // 返回值类型验证
        if (typeInfo.return && !this.check(result, typeInfo.return)) {
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
  Constructor.is = function (object) {
    return Type.check(object, typeName);
  };
};

// 扩展内置对象的类型检查方法
extendTypeCheck(Number, "number");
extendTypeCheck(String, "string");
extendTypeCheck(Array, "array");
extendTypeCheck(Object, "object");
extendTypeCheck(Date, "date");
extendTypeCheck(RegExp, "regexp");
extendTypeCheck(Map, "map");
extendTypeCheck(Set, "set");
extendTypeCheck(Promise, "promise");
extendTypeCheck(Function, "function");

// 导出类型检查工具
export default Type;
