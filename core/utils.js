function query(selector, document) {
  return typeof selector === "string"
    ? document?.querySelector(selector)
    : selector;
}

const extend = function (target, source) {
  return Object.assign(target, ...sources);
};

export { query, extend };
