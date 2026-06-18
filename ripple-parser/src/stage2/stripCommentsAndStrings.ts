// Removes string and comment content from code so CALLS matching never fires inside literals or comments.
export function stripCommentsAndStrings(source: string): string {
  let result = "";
  let index = 0;

  while (index < source.length) {
    const char = source[index] ?? "";
    const next = source[index + 1] ?? "";

    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") {
        index++;
      }
      continue;
    }

    if (char === "/" && next === "*") {
      index += 2;
      while (index < source.length - 1) {
        if (source[index] === "*" && source[index + 1] === "/") {
          index += 2;
          break;
        }
        index++;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      const quote = char;
      index++;
      while (index < source.length) {
        if (source[index] === "\\") {
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index++;
          break;
        }
        index++;
      }
      result += " ";
      continue;
    }

    result += char;
    index++;
  }

  return result;
}
