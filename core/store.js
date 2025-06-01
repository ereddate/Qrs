import { reactive } from "./index.js";

class Store {
  constructor(options = {}) {
    this.state = reactive(options.state || {}, () => this._notifySubscribers());
    this.mutations = options.mutations || {};
    this.actions = options.actions || {};
    this.getters = options.getters || {};
    this.subscribers = [];
  }

  // 提交 mutation 来修改状态
  commit(mutationName, payload) {
    if (this.mutations[mutationName]) {
      this.mutations[mutationName](this.state, payload);
    } else {
      console.warn(`Mutation ${mutationName} not found`);
    }
  }

  // 分发 action
  dispatch(actionName, payload) {
    if (this.actions[actionName]) {
      this.actions[actionName](
        {
          state: this.state,
          commit: this.commit.bind(this),
          dispatch: this.dispatch.bind(this),
        },
        payload
      );
    } else {
      console.warn(`Action ${actionName} not found`);
    }
  }

  // 获取 getter
  getGetter(getterName) {
    if (this.getters[getterName]) {
      return this.getters[getterName](this.state);
    }
    return undefined;
  }

  // 订阅状态变化
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  // 通知订阅者状态变化
  _notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.state));
  }
}

export default Store;
