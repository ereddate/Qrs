import "./typeCheck.js";

class EventBus {
  constructor() {
    this.events = new Map();
  }

  // 监听事件
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(callback);
  }

  // 触发事件
  emit(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach((callback) => {
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
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      if (callback) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      } else {
        this.events.delete(eventName);
      }
    }
  }

  // 一次性监听
  once(eventName, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(eventName, wrapper);
    };
    this.on(eventName, wrapper);
  }
}

// 导出单例实例
const eventBus = new EventBus();
export { eventBus, EventBus };
