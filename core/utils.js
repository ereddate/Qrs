function query(selector, document) {
  if (typeof selector === "string") {
    return document?.querySelector(selector) || null;
  }
  return selector || null;
}

// 支持多个源对象合并，且不修改原始 target
const extend = function (target, ...sources) {
  if (typeof target !== "object" || target === null) return {};
  return Object.assign(
    {},
    target,
    ...sources.filter((s) => typeof s === "object" && s)
  );
};

export { query, extend };
