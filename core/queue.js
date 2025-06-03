const queue = new Set();
let isFlushing = false;
let flushIndex = 0;

function queueJob(job) {
  queue.add(job);
  if (!isFlushing) {
    isFlushing = true;
    Promise.resolve().then(flushJobs);
    // 在任务队列触发，DOM 可能更新后执行全局回调
    nextTick(() => {
      if (Function.is(window.globalAfterQueueJob)) {
        window.globalAfterQueueJob();
      }
    });
  }
}

function flushJobs() {
  try {
    // 转换为数组并按优先级排序
    const jobs = Array.from(queue).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );
    for (flushIndex = 0; flushIndex < jobs.length; flushIndex++) {
      jobs[flushIndex]();
    }
  } finally {
    isFlushing = false;
    queue.clear();
    flushIndex = 0;
    // 在任务队列执行完成后执行回调
    nextTick(() => {
      // 这里可以添加全局的更新完成后的回调逻辑
      // 例如触发一个全局事件
      const globalUpdateEvent = new CustomEvent("globalUpdateCompleted");
      window.dispatchEvent(globalUpdateEvent);
    });
  }
}

// 定义 nextTick 函数
const nextTick = (() => {
  const callbacks = [];
  let pending = false;

  function flushCallbacks() {
    pending = false;
    const copies = callbacks.slice();
    callbacks.length = 0;
    for (let i = 0; i < copies.length; i++) {
      copies[i]();
    }
  }

  // 优先使用MutationObserver
  let timerFunc;
  if (typeof MutationObserver !== "undefined") {
    let counter = 1;
    const observer = new MutationObserver(flushCallbacks);
    const textNode = document.createTextNode(String(counter));
    observer.observe(textNode, { characterData: true });
    timerFunc = () => {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
  } else {
    timerFunc = () => Promise.resolve().then(flushCallbacks);
  }

  return function (cb) {
    if (Function.is(cb)) {
      callbacks.push(cb);
      if (!pending) {
        pending = true;
        timerFunc();
      }
    } else {
      return new Promise((resolve) => {
        callbacks.push(resolve);
        if (!pending) {
          pending = true;
          timerFunc();
        }
      });
    }
  };
})();

export { queueJob, nextTick };
