function compileTemplate(template) {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      expression: match[1].trim(),
    });
  }

  return function (data, componentInstance) {
    const parts = [];
    let lastIndex = 0;

    matches.forEach(({ index, length, expression }) => {
      parts.push(template.slice(lastIndex, index));
      try {
        const value = evaluateExpression(expression, data);
        parts.push(value);
      } catch (error) {
        console.warn(`Error evaluating expression "${expression}":`, error);
        parts.push("");
      }
      lastIndex = index + length;
    });

    parts.push(template.slice(lastIndex));
    let html = parts.join("");
    return html;
  };
}

// 假设 evaluateExpression 函数的实现
function evaluateExpression(expression, data) {
  try {
    return new Function("data", `with(data) { return ${expression} }`)(data);
  } catch (error) {
    console.error(`Error evaluating expression "${expression}":`, error);
    return undefined;
  }
}

export default compileTemplate;
