const queue = new Set();
let isFlushing = false;
let flushIndex = 0;

/**
 * 将任务加入微任务队列，避免重复执行
 * @param {Function} job
 */
function queueJob(job) {
  if (typeof job !== "function") return;
  queue.add(job);
  if (!isFlushing) {
    isFlushing = true;
    Promise.resolve().then(flushJobs);
    // DOM 可能更新后执行全局回调
    nextTick(() => {
      if (typeof window.globalAfterQueueJob === "function") {
        window.globalAfterQueueJob();
      }
    });
  }
}

/**
 * 执行队列中的所有任务
 */
function flushJobs() {
  try {
    // 支持优先级，优先级越小越先执行
    const jobs = Array.from(queue).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );
    for (flushIndex = 0; flushIndex < jobs.length; flushIndex++) {
      try {
        jobs[flushIndex]();
      } catch (err) {
        // 单个任务异常不影响队列后续任务
        console.error("queueJob error:", err);
      }
    }
  } finally {
    isFlushing = false;
    queue.clear();
    flushIndex = 0;
    // 队列执行完成后触发全局事件
    nextTick(() => {
      if (
        typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function"
      ) {
        const globalUpdateEvent = new CustomEvent("globalUpdateCompleted");
        window.dispatchEvent(globalUpdateEvent);
      }
    });
  }
}

/**
 * nextTick：下一个微任务时机执行回调
 * @param {Function} [cb]
 * @returns {Promise|undefined}
 */
const nextTick = (() => {
  const callbacks = [];
  let pending = false;

  function flushCallbacks() {
    pending = false;
    const copies = callbacks.slice();
    callbacks.length = 0;
    for (let i = 0; i < copies.length; i++) {
      try {
        copies[i]();
      } catch (err) {
        console.error("nextTick callback error:", err);
      }
    }
  }

  // 优先使用 MutationObserver
  let timerFunc;
  if (
    typeof MutationObserver !== "undefined" &&
    typeof document !== "undefined"
  ) {
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
    if (typeof cb === "function") {
      callbacks.push(cb);
      if (!pending) {
        pending = true;
        timerFunc();
      }
    } else {
      // 支持 Promise 用法
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
