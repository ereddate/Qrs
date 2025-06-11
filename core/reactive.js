const effectStack = [];
const reactiveMap = new WeakMap();
const refMap = new WeakMap();

function isNativeObject(obj) {
  return (
    obj instanceof Date ||
    obj instanceof RegExp ||
    obj instanceof Map ||
    obj instanceof Set ||
    obj instanceof WeakMap ||
    obj instanceof WeakSet ||
    obj instanceof Promise ||
    obj instanceof Error
  );
}

function reactive(obj, callback) {
  if (typeof obj !== "object" || obj === null || isNativeObject(obj))
    return obj;
  if (reactiveMap.has(obj)) {
    return reactiveMap.get(obj);
  }
  const deps = new Map();
  const eventEmitter = createEventEmitter();
  const proxy = new Proxy(obj, {
    get(target, key, receiver) {
      if (effectStack.length > 0) {
        const activeEffect = effectStack[effectStack.length - 1];
        if (!deps.has(key)) {
          deps.set(key, new Set());
        }
        deps.get(key).add(activeEffect);
      }
      const value = Reflect.get(target, key, receiver);
      // 深度响应式
      if (typeof value === "object" && value !== null) {
        return reactive(value, callback);
      }
      return value;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (oldValue === value) {
        return true;
      }
      const result = Reflect.set(target, key, value, receiver);
      if (deps.has(key)) {
        deps.get(key).forEach((effect) => queueJob(effect));
      }
      if (typeof callback === "function") {
        nextTick(() => {
          callback(key, oldValue, value);
        });
      }
      eventEmitter.emit("set", key, value, oldValue);
      return result;
    },
    deleteProperty(target, key) {
      if (key in target) {
        const oldValue = target[key];
        const result = Reflect.deleteProperty(target, key);
        if (deps.has(key)) {
          deps.get(key).forEach((effect) => queueJob(effect));
        }
        if (typeof callback === "function") {
          nextTick(() => {
            callback(key, oldValue, undefined);
          });
        }
        eventEmitter.emit("delete", key, oldValue);
        return result;
      }
      return false;
    },
    ownKeys(target) {
      // 支持 for...in、Object.keys 等操作的依赖收集
      if (effectStack.length > 0) {
        const activeEffect = effectStack[effectStack.length - 1];
        if (!deps.has("__keys__")) {
          deps.set("__keys__", new Set());
        }
        deps.get("__keys__").add(activeEffect);
      }
      return Reflect.ownKeys(target);
    },
  });
  reactiveMap.set(obj, proxy);
  return proxy;
}

function computed(getter) {
  let value;
  let dirty = true;
  const computedDep = new Set();

  const effect = () => {
    if (!dirty) {
      dirty = true;
      computedDep.forEach((dep) => queueJob(dep));
      nextTick(() => {
        if (
          this &&
          this.props &&
          typeof this.props?.afterComputedUpdate === "function"
        ) {
          this.props.afterComputedUpdate.call(this);
        }
      });
    }
  };

  const computedObj = {
    get() {
      if (dirty) {
        effectStack.push(effect);
        value = getter();
        effectStack.pop();
        dirty = false;
      }
      if (effectStack.length > 0) {
        const activeEffect = effectStack[effectStack.length - 1];
        computedDep.add(activeEffect);
      }
      return value;
    },
  };

  return computedObj;
}

function watch(source, callback, context) {
  let getter;
  if (typeof source === "function") {
    getter = source;
  } else if (typeof source === "string") {
    getter = () => {
      if (!context?.data) return undefined;
      let obj = context.data;
      const keys = source.split(".");
      for (const key of keys) {
        if (obj && typeof obj === "object") {
          obj = obj[key];
        } else {
          return undefined;
        }
      }
      return obj;
    };
  } else {
    throw new Error("watch's first parameter must be a function or string");
  }

  let oldValue = getter();
  const effect = () => {
    effectStack.push(effect);
    const newValue = getter();
    effectStack.pop();
    if (!Object.is(newValue, oldValue)) {
      callback(oldValue, newValue);
      oldValue = newValue;
      nextTick(() => {
        if (
          context &&
          context.props &&
          typeof context.props?.afterWatchUpdate === "function"
        ) {
          context.props.afterWatchUpdate.call(context, oldValue, newValue);
        }
      });
    }
  };

  effectStack.push(effect);
  getter();
  effectStack.pop();
}

// 自定义事件触发器
function createEventEmitter() {
  const listeners = {};
  return {
    on(event, callback) {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    },
    emit(event, ...args) {
      if (listeners[event]) {
        listeners[event].forEach((callback) => callback(...args));
      }
    },
    off(event, callback) {
      if (!listeners[event]) return;
      if (!callback) {
        listeners[event] = [];
      } else {
        listeners[event] = listeners[event].filter((cb) => cb !== callback);
      }
    },
    clear() {
      Object.keys(listeners).forEach((event) => {
        listeners[event] = [];
      });
    },
  };
}

// 增强 ref 函数
function ref(initialValue) {
  if (isRef(initialValue)) {
    return initialValue;
  }
  let _value = initialValue;
  const refObject = {
    __v_isRef: true,
    get value() {
      if (effectStack.length > 0) {
        const activeEffect = effectStack[effectStack.length - 1];
        if (!refMap.has(refObject)) {
          refMap.set(refObject, new Set());
        }
        refMap.get(refObject).add(activeEffect);
      }
      return _value;
    },
    set value(newValue) {
      if (!Object.is(_value, newValue)) {
        const oldValue = _value;
        _value = newValue;
        if (refMap.has(refObject)) {
          refMap.get(refObject).forEach((effect) => queueJob(effect));
        }
      }
    },
  };
  return refObject;
}

// 实现 isRef 函数
function isRef(obj) {
  return obj && obj.__v_isRef === true;
}

// 增强 toRefs 函数，支持深层转换
function toRefs(object) {
  if (!isReactive(object)) {
    return object;
  }
  const result = {};
  for (const key in object) {
    if (typeof object[key] === "object" && object[key] !== null) {
      result[key] = toRefs(object[key]);
    } else {
      result[key] = {
        __v_isRef: true,
        get value() {
          return object[key];
        },
        set value(newValue) {
          object[key] = newValue;
        },
      };
    }
  }
  return result;
}

function isReactive(obj) {
  return reactiveMap.has(obj);
}

import { queueJob, nextTick } from "./queue.js";
export { reactive, computed, watch, ref, isRef, toRefs, isReactive };
