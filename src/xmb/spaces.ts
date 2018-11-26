const unicodeSpace = '\\u0020';
const unicodeSpaceRe = new RegExp(`\\${unicodeSpace}`, 'g');

/**
 * Replaces trailing and leading, or multiple-sequential spaces in the text to
 * ensure that they get preserved in XML, with a unicode space. xml-js
 * in particular doesn't support this, but other tooling generally does
 * and we can manually swap it back when we convert the other way.
 */
export function preserveSpaces(text: string) {
  return text.replace(/^ +|  +| +$/g, value => unicodeSpace.repeat(value.length));
}

/**
 * Restores spaces preserved by preserveSpaces.
 */
export function restoreSpaces(text: string) {
  unicodeSpaceRe.lastIndex = 0;
  return text.replace(unicodeSpaceRe, ' ');
}
