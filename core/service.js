// 服务端渲染相关函数
function vnodeToHtml(vnode) {
  if (String.is(vnode) || Number.is(vnode)) {
    return vnode.toString();
  }
  if (!vnode.tag) {
    return "";
  }

  const attrs = Object.entries(vnode.props || {})
    .map(([key, value]) => ` ${key}="${value}"`)
    .join("");

  const childrenHtml = (vnode.children || [])
    .map((child) => vnodeToHtml(child))
    .join("");

  return `<${vnode.tag}${attrs}>${childrenHtml}</${vnode.tag}>`;
}

async function prefetchData(app) {
  if (app.prefetch) {
    return await app.prefetch();
  }
  return {};
}

function injectState(initialState) {
  return `<script>window.__INITIAL_STATE__ = ${JSON.stringify(
    initialState
  )};</script>`;
}

export { vnodeToHtml, prefetchData, injectState };
