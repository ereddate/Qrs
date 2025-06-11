// 安全地求值表达式
function safeEvaluate(expression, data, filters = {}) {
  try {
    const filterRegex = /(\w+)\|(\w+)(?:\((.*)\))?/;
    const match = expression.match(filterRegex);
    if (match) {
      const valueExpression = match[1].trim();
      const filterName = match[2].trim();
      const args = match[3] ? match[3].split(",").map((arg) => arg.trim()) : [];
      const value = evaluateValue(valueExpression, data);
      if (filters[filterName]) {
        return filters[filterName](value, ...args);
      }
    }
    return evaluateValue(expression, data);
  } catch (error) {
    console.error(`Error evaluating expression "${expression}":`, error);
    return undefined;
  }
}

// 封装表达式求值逻辑
function evaluateValue(expression, data) {
  // 处理复杂表达式，避免潜在的原型污染
  const sanitizedExpression = expression.replace(
    /__proto__|constructor|prototype/g,
    ""
  );
  return new Function(
    "data",
    `
        "use strict";
        const { ${Object.keys(data).join(", ")} } = data;
        return ${sanitizedExpression};
    `
  )(data);
}

// 缓存编译结果
const compileCache = new Map();

function compileTemplate(template, options = {}) {
  const cacheKey = `${template}-${JSON.stringify(options)}`;
  if (compileCache.has(cacheKey)) {
    return compileCache.get(cacheKey);
  }

  const {
    filters = {},
    directives = {},
    methods = {},
    components = {},
  } = options;
  const interpolationRegex = /\{\{([^}]+)\}\}/g;
  const directiveRegex = /v-(\w+)(?:\s*=\s*["']([^"']+)["'])?/g;
  const conditionalRegex = /v-if\s*=\s*["']([^"']+)["']/;
  const loopRegex = /v-for\s*=\s*["']([^"']+) in ([^"']+)["']/;
  const eventRegex = /@(\w+)\s*=\s*["']([^"']+)["']/g;
  const modelRegex = /v-model\s*=\s*["']([^"']+)["']/;
  const componentRegex = /<([A-Z]\w*)([^>]*)>([\s\S]*?)<\/\1>/g;
  const slotRegex = /<slot(?:\s+name="([^"]+)")?><\/slot>/g;

  // 优化：只返回处理结果，不做无用的遍历
  const parseDirectives = (element, data) => {
    let match;
    const directivesFound = [];
    while ((match = directiveRegex.exec(element)) !== null) {
      const directiveName = match[1];
      const directiveValue = match[2];
      directivesFound.push({ name: directiveName, value: directiveValue });
    }
    directivesFound.forEach((directive) => {
      if (directives[directive.name]) {
        directives[directive.name](element, directive.value, data);
      }
    });
  };

  const handleConditional = (element, data) => {
    const match = element.match(conditionalRegex);
    if (match) {
      const condition = match[1];
      const shouldRender = safeEvaluate(condition, data, filters);
      return shouldRender ? element : "";
    }
    return element;
  };

  const handleLoop = (element, data) => {
    const match = element.match(loopRegex);
    if (match) {
      const [item, index] = match[1].split(",").map((part) => part.trim());
      const arrayExpression = match[2];
      const array = safeEvaluate(arrayExpression, data, filters);
      if (Array.isArray(array)) {
        return array
          .map((value, i) => {
            const newData = { ...data, [item]: value };
            if (index) {
              newData[index] = i;
            }
            return element
              .replace(loopRegex, "")
              .replace(interpolationRegex, (_, expr) => {
                return safeEvaluate(expr, newData, filters) || "";
              });
          })
          .join("");
      }
    }
    return element;
  };

  const handleEvents = (element, data) => {
    return element.replace(eventRegex, (_, eventName, handlerExpression) => {
      const handler = () => {
        // 处理方法调用参数
        if (
          handlerExpression.includes("(") &&
          handlerExpression.includes(")")
        ) {
          const methodName = handlerExpression.split("(")[0].trim();
          const params = handlerExpression
            .slice(
              handlerExpression.indexOf("(") + 1,
              handlerExpression.indexOf(")")
            )
            .split(",")
            .map((param) => param.trim());
          if (methods[methodName]) {
            return methods[methodName](
              ...params.map((param) => safeEvaluate(param, data, filters))
            );
          }
        } else if (methods[handlerExpression]) {
          return methods[handlerExpression]();
        }
        return safeEvaluate(handlerExpression, data, filters);
      };
      // 事件绑定只做标记，实际事件绑定由框架运行时处理
      return `data-event-${eventName}="${handler.toString()}"`;
    });
  };

  const handleModel = (element, data) => {
    return element.replace(modelRegex, (_, modelExpression) => {
      const value = safeEvaluate(modelExpression, data, filters);
      const inputType = element.match(/type="([^"]+)"/);
      const type = inputType ? inputType[1] : "text";
      let newElement = element.replace(modelRegex, "");

      if (type === "checkbox") {
        newElement = newElement.replace(
          ">",
          ` checked="${value ? "checked" : ""}">`
        );
        newElement += ` data-model="${modelExpression}"`;
      } else {
        newElement = newElement.replace(">", ` value="${value}">`);
        newElement += ` data-model="${modelExpression}"`;
      }

      return newElement;
    });
  };

  const handleComponents = (element, data, parentSlots = {}) => {
    return element.replace(
      componentRegex,
      (_, componentName, attrs, innerHTML) => {
        if (components[componentName]) {
          const component = components[componentName];
          const componentData = { ...data };
          const slotContent = {};
          // 解析默认插槽
          slotContent.default = innerHTML;
          // 解析具名插槽
          const namedSlots = innerHTML.match(
            /<template\s+slot="([^"]+)">([\s\S]*?)<\/template>/g
          );
          if (namedSlots) {
            namedSlots.forEach((slot) => {
              const match = slot.match(
                /<template\s+slot="([^"]+)">([\s\S]*?)<\/template>/
              );
              if (match) {
                slotContent[match[1]] = match[2];
              }
            });
          }

          // 解析属性
          const attrRegex = /(\w+)\s*=\s*["']([^"']+)["']/g;
          let attrMatch;
          while ((attrMatch = attrRegex.exec(attrs)) !== null) {
            const attrName = attrMatch[1];
            const attrValue = safeEvaluate(attrMatch[2], data, filters);
            componentData[attrName] = attrValue;
          }

          const componentTemplate = component.template;
          const compiledComponentTemplate = compileTemplate(componentTemplate, {
            filters,
            directives,
            methods,
            components,
          });
          const componentHTML = compiledComponentTemplate({
            ...componentData,
            $slots: { ...parentSlots, ...slotContent },
          });

          return componentHTML.replace(slotRegex, (_, slotName) => {
            const name = slotName || "default";
            return slotContent[name] || "";
          });
        }
        return element;
      }
    );
  };

  const compiledFunction = function (data) {
    let result = template;
    // 处理组件
    result = handleComponents(result, data);
    // 处理 v-for 循环
    result = result.replace(/<[^>]*v-for[^>]*>([\s\S]*?)<\/[^>]*>/g, (match) =>
      handleLoop(match, data)
    );
    // 处理 v-if 条件渲染
    result = result.replace(/<[^>]*v-if[^>]*>([\s\S]*?)<\/[^>]*>/g, (match) =>
      handleConditional(match, data)
    );
    // 处理事件绑定
    result = handleEvents(result, data);
    // 处理 v-model 双向绑定
    result = handleModel(result, data);
    // 处理插值表达式
    result = result.replace(interpolationRegex, (_, expr) => {
      return safeEvaluate(expr, data, filters) || "";
    });
    // 处理自定义指令
    result = result.replace(/<[^>]+>/g, (element) => {
      parseDirectives(element, data);
      return element;
    });
    return result;
  };

  compileCache.set(cacheKey, compiledFunction);
  return compiledFunction;
}

export default compileTemplate;
