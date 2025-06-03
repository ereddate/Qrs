const effectStack = [];
const reactiveMap = new WeakMap();

function reactive(obj, callback) {
  if (reactiveMap.has(obj)) {
    return reactiveMap.get(obj);
  }
  const deps = new Map();
  const eventEmitter = createEventEmitter();
  // 支持 Proxy 的环境
  const proxy = new Proxy(obj, {
    get(target, key) {
      if (effectStack.length > 0) {
        const activeEffect = effectStack[effectStack.length - 1];
        if (!deps.has(key)) {
          deps.set(key, new Set());
        }
        deps.get(key).add(activeEffect);
      }
      const value = target[key];
      //return Object.is(value) && value !== null ? reactive(value) : value;
      return value;
    },
    set(target, key, value) {
      if (target[key] === value) {
        return true;
      }
      const oldValue = target[key];
      target[key] = value;
      if (deps.has(key)) {
        deps.get(key).forEach((effect) => queueJob(effect));
      }
      if (Function.is(callback)) {
        nextTick(() => {
          callback(key, oldValue, value);
        });
      }
      return true;
    },
    deleteProperty(target, key) {
      if (key in target) {
        const oldValue = target[key];
        delete target[key];
        if (deps.has(key)) {
          deps.get(key).forEach((effect) => queueJob(effect));
        }
        if (Function.is(callback)) {
          nextTick(() => {
            callback(key, oldValue, undefined);
          });
        }
        eventEmitter.emit("delete", key, oldValue);
        return true;
      }
      return false;
    },
  });
  reactiveMap.set(obj, proxy);
  return proxy;
}

function computed(getter) {
  let value;
  let dirty = true;
  const computedDep = new Set();
  let lastGetter = getter;

  const effect = () => {
    if (!dirty) {
      dirty = true;
      // 触发 computed 属性自身的依赖更新
      computedDep.forEach((dep) => queueJob(dep));
      // 在 computed 属性更新，DOM 可能更新后执行回调
      nextTick(() => {
        if (Function.is(this.props?.afterComputedUpdate)) {
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
        lastGetter = getter;
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

function watch(source, callback) {
  let getter;
  if (Function.is(source)) {
    getter = source;
  } else if (String.is(source)) {
    getter = () => {
      let obj = this.data;
      const keys = source.split(".");
      for (const key of keys) {
        if (obj && Object.is(obj)) {
          obj = obj[key];
        } else {
          return undefined;
        }
      }
      return obj;
    };
  } else {
    throw new Error("watch 的第一个参数必须是函数或字符串");
  }

  let oldValue = getter();
  const effect = () => {
    effectStack.push(effect);
    const newValue = getter();
    effectStack.pop();
    if (!Object.is(newValue, oldValue)) {
      callback(oldValue, newValue);
      oldValue = newValue;
      // 在数据变化，DOM 可能更新后执行回调
      nextTick(() => {
        if (Function.is(this.props?.afterWatchUpdate)) {
          this.props.afterWatchUpdate.call(this, oldValue, newValue);
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
  };
}

import { queueJob, nextTick } from "./queue.js";
export { reactive, computed, watch };
