import "./typeCheck.js";

class EventBus {
  constructor() {
    this.events = new Map();
  }

  // 监听事件
  on(eventName, callback) {
    if (typeof callback !== "function") return;
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(callback);
    // 返回取消监听函数
    return () => this.off(eventName, callback);
  }

  // 触发事件
  emit(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (callbacks && callbacks.length) {
      // 防止回调过程中修改数组导致遍历异常
      callbacks.slice().forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`EventBus error in ${eventName}:`, error);
        }
      });
    }
  }

  // 移除事件监听
  off(eventName, callback) {
    if (!eventName) {
      // 移除所有事件
      this.events.clear();
      return;
    }
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      if (callback) {
        // 支持批量移除同名回调
        this.events.set(
          eventName,
          callbacks.filter((cb) => cb !== callback)
        );
        if (this.events.get(eventName).length === 0) {
          this.events.delete(eventName);
        }
      } else {
        this.events.delete(eventName);
      }
    }
  }

  // 一次性监听
  once(eventName, callback) {
    if (typeof callback !== "function") return;
    const wrapper = (...args) => {
      callback(...args);
      this.off(eventName, wrapper);
    };
    this.on(eventName, wrapper);
  }

  // 获取事件监听数量
  listenerCount(eventName) {
    const callbacks = this.events.get(eventName);
    return callbacks ? callbacks.length : 0;
  }

  // 获取所有事件名
  eventNames() {
    return Array.from(this.events.keys());
  }

  // 清空所有事件
  clear() {
    this.events.clear();
  }
}

// 导出单例实例
const eventBus = new EventBus();
export { eventBus, EventBus };
