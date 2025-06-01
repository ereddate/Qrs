import Store from "../../core/store.js";

// 定义 state、mutations、actions 和 getters
const state = {
  count: 0,
};

const mutations = {
  increment(state) {
    state.count++;
  },
  decrement(state) {
    state.count--;
  },
};

const actions = {
  incrementAsync({ commit }) {
    setTimeout(() => {
      commit("increment");
    }, 1000);
  },
};

const getters = {
  doubleCount(state) {
    return state.count * 2;
  },
};

// 创建 Store 实例
const store = new Store({
  state,
  mutations,
  actions,
  getters,
});

export default store;
