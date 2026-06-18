// Token-based same-file CALLS detection that avoids regex lookbehind and HTML/JSX false positives.
import { stripCommentsAndStrings } from "./stripCommentsAndStrings";

const HTML_TAG_WHITELIST = new Set([
  "div",
  "span",
  "p",
  "a",
  "img",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "li",
  "section",
  "article",
]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isIdentifierChar(char: string): boolean {
  return /[A-Za-z0-9_$]/.test(char);
}

function isPascalCase(name: string): boolean {
  const first = name.charAt(0);
  return first >= "A" && first <= "Z";
}

function hasFunctionCall(body: string, name: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegex(name)}\\s*\\(`, "g");
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body)) !== null) {
    const previousIndex = match.index - 1;
    const previousChar = previousIndex >= 0 ? body.charAt(previousIndex) : "";
    if (previousChar === "." || isIdentifierChar(previousChar)) {
      continue;
    }
    return true;
  }

  return false;
}

function hasJsxUsage(body: string, name: string): boolean {
  if (!isPascalCase(name) || HTML_TAG_WHITELIST.has(name.toLowerCase())) {
    return false;
  }
  const pattern = new RegExp(`<${escapeRegex(name)}\\b`);
  return pattern.test(body);
}

export function findCalledNames(
  rawBody: string,
  candidateNames: string[]
): Set<string> {
  const body = stripCommentsAndStrings(rawBody);
  const found = new Set<string>();

  for (const name of candidateNames) {
    if (name.length === 0) {
      continue;
    }
    if (hasFunctionCall(body, name) || hasJsxUsage(body, name)) {
      found.add(name);
    }
  }

  return found;
}
