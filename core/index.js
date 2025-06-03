import { eventBus } from "./eventBus.js";
import { reactive } from "./reactive.js";
import { Component, isComponent } from "./component.js";
import { VNode, isVNode, createElem } from "./vnode.js";
import { Transition, isTransition } from "./transition.js";
import { nextTick } from "./queue.js";
import { query, extend } from "./utils.js";
import { vnodeToHtml, prefetchData, injectState } from "./service.js";

function createApp(rootComponent) {
  return {
    mount(rootContainer, document) {
      const globalDocument = document || window.document;
      rootContainer = query(rootContainer, globalDocument);
      const rootEl = rootComponent.render();
      rootComponent.el = rootEl;
      rootContainer.appendChild(rootEl);
      // 在应用挂载完成，DOM 渲染后执行回调
      nextTick(() => {
        if (Function.is(rootComponent.props?.afterAppMount)) {
          rootComponent.props.afterAppMount.call(rootComponent);
        }
      });
    },
  };
}

const name = "Qrs";

export {
  name,
  reactive,
  createElem,
  Component,
  isComponent,
  createApp,
  VNode,
  isVNode,
  query,
  nextTick,
  eventBus,
  vnodeToHtml,
  prefetchData,
  injectState,
  Transition,
  isTransition,
  extend,
};
