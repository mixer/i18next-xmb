import * as xml from 'xml-js';

import { IInterpolationOptions, lex, Token, TokenType } from '../grammar';
import { I18nextNode, I18nextObject } from '../types';
import { preserveSpaces } from './spaces';

/**
 * Options for i18nextToXmbObject.
 */
export interface IObjectToXmbObjectOptions {
  prefix: string;
  descriptionKey: (key: string) => string | void;
  transformDescription: (key: string) => string;
  encodeInterpolation: (token: Token) => string | number | boolean;
  interpolation: Partial<IInterpolationOptions>;
}

/**
 * Serializes an i18next JSON object into a list of XMB objects.
 */
export function i18nextToXmbObject(
  object: I18nextObject,
  partialOptions?: Partial<IObjectToXmbObjectOptions>,
) {
  const options: IObjectToXmbObjectOptions = {
    prefix: '',
    descriptionKey: () => undefined,
    transformDescription: (s: string) => s,
    interpolation: {},
    encodeInterpolation: JSON.stringify,
    ...partialOptions,
  };

  const queue: Array<{ path: string[]; node: I18nextNode; description?: string }> = [];
  const pushToQueue = (path: string[], currentObject: I18nextObject) => {
    const descKey = options.descriptionKey(path[path.length - 1]);
    const node = currentObject[path[path.length - 1]];
    if (descKey && typeof currentObject[descKey] === 'string') {
      descriptionKeys.add(descKey);
      queue.push({
        path,
        node,
        description: options.transformDescription(currentObject[descKey] as string),
      });
    } else {
      queue.push({ path, node });
    }
  };

  const elements: xml.Element[] = [];
  const descriptionKeys = new Set<string | void>();
  for (const key of Object.keys(object)) {
    pushToQueue([key], object);
  }

  while (queue.length > 0) {
    const { path, node, description } = queue.pop()!;
    if (descriptionKeys.has(path[path.length - 1])) {
      continue;
    }

    if (typeof node === 'string') {
      elements.push(messageToElement(path, node, description, options));
    } else if (node instanceof Array) {
      for (let i = 0; i < node.length; i++) {
        queue.push({ path: [...path, String(i)], node: node[i] });
      }
    } else {
      for (const key of Object.keys(node)) {
        pushToQueue([...path, key], node);
      }
    }
  }

  return elements;
}

/**
 * Doctype header for xmb files.
 */
export const xmlDocType = `messagebundle [
  <!ELEMENT messagebundle (msg)*>
  <!ATTLIST messagebundle class CDATA #IMPLIED>
  <!ELEMENT msg (#PCDATA|ph|source)*>
  <!ATTLIST msg id CDATA #IMPLIED>
  <!ATTLIST msg seq CDATA #IMPLIED>
  <!ATTLIST msg name CDATA #IMPLIED>
  <!ATTLIST msg desc CDATA #IMPLIED>
  <!ATTLIST msg xml:space (default|preserve) "default">
  <!ELEMENT source (#PCDATA)>
  <!ELEMENT ph (#PCDATA|ex)*>
  <!ATTLIST ph name CDATA #REQUIRED>
  <!ELEMENT ex (#PCDATA)>
]`;

/*
 * Options for i18nextToXmbObject.
 */
export interface IObjectToXmbStringOptions extends IObjectToXmbObjectOptions {
  serialize: xml.Options.JS2XML;
}

/**
 * Converts an i18next object to a fully-qualified XMB file.
 */
export function i18nextToXmbString(
  object: I18nextObject,
  options: Partial<IObjectToXmbStringOptions> = {},
) {
  return xml.js2xml(
    {
      declaration: {
        attributes: {
          version: '1.0',
          encoding: 'UTF-8',
        },
      },
      elements: [
        {
          type: 'doctype',
          doctype: xmlDocType,
        },
        {
          type: 'element',
          name: 'messagebundle',
          elements: i18nextToXmbObject(object, options),
        },
      ],
    },
    { ...options.serialize },
  );
}

/**
 * Converts an i18next JSON message to an xmb msg element.
 */
function messageToElement(
  path: ReadonlyArray<string>,
  value: string,
  description: string | void,
  options: IObjectToXmbObjectOptions,
): xml.Element {
  return {
    type: 'element',
    name: 'msg',
    attributes: {
      id: options.prefix + path.join('.'),
      desc: description || value,
    },
    elements: lex(value, options.interpolation).map((token, i) => {
      const { start, end, ...tokenData } = token;

      switch (token.type) {
        case TokenType.Text:
          return { type: 'text', text: preserveSpaces(token.value) };
        default:
          return {
            type: 'element',
            name: 'ph',
            attributes: {
              name: `INTERPOLATION_${i}`,
            },
            elements: [
              {
                type: 'element',
                name: 'ex',
                elements: [{ type: 'text', text: options.encodeInterpolation(tokenData) }],
              },
            ],
          };
      }
    }),
  };
}
