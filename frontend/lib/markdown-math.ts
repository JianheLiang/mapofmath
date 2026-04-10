const DISPLAYSTYLE_TOKEN = "{\\displaystyle";

function wrapMathExpression(expression: string, displayMode: boolean): string {
  const math = expression.trim();
  if (!math) {
    return "";
  }

  return displayMode ? `\n$$\n${math}\n$$\n` : `$${math}$`;
}

function replaceDisplayStyleBlocks(markdown: string): string {
  let cursor = 0;
  let normalized = "";

  while (cursor < markdown.length) {
    const start = markdown.indexOf(DISPLAYSTYLE_TOKEN, cursor);
    if (start === -1) {
      normalized += markdown.slice(cursor);
      break;
    }

    normalized += markdown.slice(cursor, start);

    let contentStart = start + DISPLAYSTYLE_TOKEN.length;
    while (/\s/.test(markdown[contentStart] ?? "")) {
      contentStart += 1;
    }

    let depth = 1;
    let index = contentStart;
    while (index < markdown.length && depth > 0) {
      const character = markdown[index];
      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
      }
      index += 1;
    }

    if (depth !== 0) {
      normalized += markdown.slice(start);
      break;
    }

    const expression = markdown.slice(contentStart, index - 1);
    const lineStart = markdown.lastIndexOf("\n", start - 1) + 1;
    const lineEndIndex = markdown.indexOf("\n", index);
    const lineEnd = lineEndIndex === -1 ? markdown.length : lineEndIndex;
    const prefix = markdown.slice(lineStart, start).trim();
    const suffix = markdown.slice(index, lineEnd).trim();
    const isDisplayBlock = prefix === "" && suffix === "";

    normalized += wrapMathExpression(expression, isDisplayBlock);
    cursor = index;
  }

  return normalized;
}

export function normalizeMarkdownMath(markdown: string): string {
  return replaceDisplayStyleBlocks(markdown)
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_match, expression: string) =>
      wrapMathExpression(expression, true),
    )
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_match, expression: string) =>
      wrapMathExpression(expression, false),
    );
}
