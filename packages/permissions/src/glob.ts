/**
 * Simple glob matcher supporting:
 * - * matches any characters except /
 * - ** matches any characters including /
 * - ? matches a single character
 */
export function globMatch(pattern: string, input: string): boolean {
  const regex = globToRegex(pattern);
  return regex.test(input);
}

function globToRegex(pattern: string): RegExp {
  let result = '^';
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === '*') {
      if (i + 1 < pattern.length && pattern[i + 1] === '*') {
        // ** matches anything including path separators
        result += '.*';
        i += 2;
        // Skip trailing slash after **
        if (i < pattern.length && pattern[i] === '/') {
          i++;
        }
      } else {
        // * matches anything except path separator
        result += '[^/]*';
        i++;
      }
    } else if (char === '?') {
      result += '[^/]';
      i++;
    } else if (char === '[') {
      // Character class - pass through
      result += '[';
      i++;
      while (i < pattern.length && pattern[i] !== ']') {
        result += pattern[i];
        i++;
      }
      if (i < pattern.length) {
        result += ']';
        i++;
      }
    } else if ('.+^${}()|\\'.includes(char)) {
      result += '\\' + char;
      i++;
    } else {
      result += char;
      i++;
    }
  }

  result += '$';
  return new RegExp(result);
}
