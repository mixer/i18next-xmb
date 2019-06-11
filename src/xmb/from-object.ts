import * as xml from 'xml-js';

import { compile, IInterpolationOptions, Token, TokenType } from '../grammar';
import { I18nextObject } from '../types';
import { restoreSpaces } from './spaces';

/**
 * Options for appendToXmbObject.
 */
export interface IFromXmbObjectOptions {
  prefix: string;
  decodeInterpolation: (interpolation: string | number | boolean) => string;
  getId: (message: xml.Element) => string | void;
  allowNested?: boolean;
  interpolation: Partial<IInterpolationOptions>;
}

/**
 * Parses an XMB object and returns all translations from it as an i18next
 * JSON format object.
 */
export function fromXmbObject(
  xmb: xml.Element,
  options: Partial<IFromXmbObjectOptions> = {},
): I18nextObject {
  const {
    prefix = '',
    decodeInterpolation = String,
    allowNested = true,
    getId = (el: xml.Element) => el.attributes && String(el.attributes.id),
  } = options;

  if (!xmb.elements) {
    throw malformedError('elements are empty');
  }

  if (xmb.elements.length !== 2) {
    throw malformedError(
      `expected exactly two direct elements (doctype and messagebundle), ` +
        `got ${xmb.elements.length}`,
    );
  }

  const messages = xmb.elements[1].elements;
  if (!messages) {
    return {};
  }

  const object: I18nextObject = {};
  for (const message of messages) {
    const id = getId(message);
    if (!id || !id.startsWith(prefix)) {
      continue;
    }

    const tokens: Token[] = [];
    if (!message.elements) {
      continue;
    }

    for (const element of message.elements) {
      if (element.type === 'text') {
        tokens.push({ type: TokenType.Text, value: restoreSpaces(String(element.text)) });
      }

      if (element.name !== 'ph' || !element.elements) {
        continue;
      }
      const example = element.elements.find(e => e.name === 'ex');
      if (!example || !example.elements) {
        continue;
      }

      try {
        tokens.push(JSON.parse(String(example.elements[0].text)));
      } catch (e) {
        tokens.push({
          type: TokenType.Interpolation,
          value: decodeInterpolation(example.elements[0].text!),
        });
      }
    }

    if (allowNested) {
      setDeep(object, id.slice(prefix.length).split('.'), compile(tokens, options.interpolation));
    } else {
      object[id.slice(prefix.length)] = compile(tokens, options.interpolation);
    }
  }

  return object;
}

/**
 * Options for fromXmbString.
 */
export interface IFromXmbStringOptions extends IFromXmbObjectOptions {
  parse: xml.Options.XML2JS;
}

/**
 * Parses an XMB string and returns all translations from it as an i18next
 * JSON format object.
 */
export function fromXmbString(xmb: string, options: Partial<IFromXmbStringOptions> = {}) {
  const object = xml.xml2js(xmb, { ...options.parse, trim: true, compact: false });
  return fromXmbObject(object as xml.Element, options);
}

function malformedError(details: string): Error {
  return new Error(`The provided XMB file is invalid: ${details}`);
}

/**
 * Sets the deep value within the target object. Supports arrays.
 */
function setDeep(target: any, path: string[], value: any) {
  while (path.length > 1) {
    const segment = path.shift()!;
    if (target[segment]) {
      // noop
    } else if (/^[0-9]+$/.test(path[0])) {
      target[segment] = [];
    } else {
      target[segment] = {};
    }

    target = target[segment];
  }

  target[path[0]] = value;
}
