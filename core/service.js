// 服务端渲染相关函数

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function vnodeToHtml(vnode) {
  if (typeof vnode === "string" || typeof vnode === "number") {
    return escapeHtml(vnode);
  }
  if (!vnode || !vnode.tag) {
    return "";
  }

  // 处理属性，避免 undefined/null
  const attrs = Object.entries(vnode.props || {})
    .filter(([key, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // 布尔属性处理
      if (typeof value === "boolean") {
        return value ? ` ${key}` : "";
      }
      // style 对象转字符串
      if (key === "style" && typeof value === "object") {
        const styleStr = Object.entries(value)
          .map(([k, v]) => `${k}:${v}`)
          .join(";");
        return ` style="${escapeHtml(styleStr)}"`;
      }
      // dataset 支持
      if (key.startsWith("data-")) {
        return ` ${key}="${escapeHtml(value)}"`;
      }
      // class 支持数组和对象
      if (key === "class") {
        if (Array.isArray(value)) {
          return ` class="${escapeHtml(value.join(" "))}"`;
        }
        if (typeof value === "object") {
          return (
            ' class="' +
            escapeHtml(
              Object.keys(value)
                .filter((k) => value[k])
                .join(" ")
            ) +
            '"'
          );
        }
        return ` class="${escapeHtml(value)}"`;
      }
      return ` ${key}="${escapeHtml(value)}"`;
    })
    .join("");

  // 递归渲染子节点
  const children = Array.isArray(vnode.children)
    ? vnode.children
    : vnode.children
    ? [vnode.children]
    : [];
  const childrenHtml = children.map((child) => vnodeToHtml(child)).join("");

  // 自闭合标签处理
  const selfClosingTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);
  if (selfClosingTags.has(vnode.tag)) {
    return `<${vnode.tag}${attrs} />`;
  }

  return `<${vnode.tag}${attrs}>${childrenHtml}</${vnode.tag}>`;
}

async function prefetchData(app) {
  if (typeof app?.prefetch === "function") {
    try {
      return await app.prefetch();
    } catch (e) {
      console.error("prefetch error:", e);
      return {};
    }
  }
  return {};
}

function injectState(initialState) {
  // 防止 XSS，序列化时替换 <
  const safeState = JSON.stringify(initialState).replace(/</g, "\\u003c");
  return `<script>window.__INITIAL_STATE__ = ${safeState};</script>`;
}

export { vnodeToHtml, prefetchData, injectState };
