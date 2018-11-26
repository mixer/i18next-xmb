import * as xml from 'xml-js';

import { IInterpolationOptions, lex, TokenType } from '../grammar';
import { I18nextNode, I18nextObject } from '../types';
import { preserveSpaces } from './spaces';

/**
 * Options for i18nextToXmbObject.
 */
export interface IObjectToXmbObjectOptions {
  prefix: string;
  interpolation: Partial<IInterpolationOptions>;
}

/**
 * Serializes an i18next JSON object into a list of XMB objects.
 */
export function i18nextToXmbObject(
  object: I18nextObject,
  partialOptions?: Partial<IObjectToXmbObjectOptions>,
) {
  const options: IObjectToXmbObjectOptions = { prefix: '', interpolation: {}, ...partialOptions };

  const queue: Array<{ path: string[]; node: I18nextNode }> = [];
  const elements: xml.Element[] = [];
  for (const key of Object.keys(object)) {
    queue.push({ path: [key], node: object[key] });
  }

  while (queue.length > 0) {
    const { path, node } = queue.pop()!;
    if (typeof node === 'string') {
      elements.push(messageToElement(path, node, options));
    } else if (node instanceof Array) {
      for (let i = 0; i < node.length; i++) {
        queue.push({ path: [...path, String(i)], node: node[i] });
      }
    } else {
      for (const key of Object.keys(node)) {
        queue.push({ path: [...path, key], node: node[key] });
      }
    }
  }

  return elements;
}

/**
 * Doctype header for xmb files.
 */
const xmlDocType = `<!ELEMENT messagebundle (msg)*>
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
<!ELEMENT ex (#PCDATA)>`;

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
  options: IObjectToXmbObjectOptions,
): xml.Element {
  return {
    type: 'element',
    name: 'msg',
    attributes: {
      id: options.prefix + path.join('.'),
      desc: value,
    },
    elements: lex(value, options.interpolation).map(token => {
      switch (token.type) {
        case TokenType.Text:
          return { type: 'text', text: preserveSpaces(token.value) };
        default:
          return {
            type: 'element',
            name: 'ph',
            elements: [
              {
                type: 'element',
                name: 'ex',
                elements: [{ type: 'text', text: JSON.stringify(token) }],
              },
            ],
          };
      }
    }),
  };
}
