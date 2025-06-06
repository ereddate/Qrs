// 根模块
const rootModule = {
  state: {
    rootCount: 0,
  },
  mutations: {
    incrementRoot(state) {
      state.rootCount++;
    },
  },
  actions: {
    asyncIncrementRoot({ commit }) {
      setTimeout(() => {
        commit("incrementRoot");
      }, 1000);
    },
  },
  getters: {
    doubleRootCount(state) {
      return state.rootCount * 2;
    },
  },
  modules: {
    // 子模块
    user: {
      namespaced: true,
      state: {
        name: "John",
      },
      mutations: {
        updateName(state, newName) {
          state.name = newName;
        },
      },
      actions: {
        asyncUpdateName({ commit }, newName) {
          setTimeout(() => {
            commit("updateName", newName);
          }, 1000);
        },
      },
      getters: {
        upperCaseName(state) {
          return state.name.toUpperCase();
        },
      },
    },
  },
};

const store = new Store({
  modules: rootModule,
  plugins: [
    (store) => {
      console.log("Store initialized");
      store.subscribe((mutation, state) => {
        console.log("Mutation committed:", mutation.type);
      });
    },
  ],
});

// 使用示例
store.commit("incrementRoot");
store.dispatch("asyncIncrementRoot");
console.log(store.getters.doubleRootCount);

store.commit("user/updateName", "Jane");
store.dispatch("user/asyncUpdateName", "Alice");
console.log(store.getters["user/upperCaseName"]);
