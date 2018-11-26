import * as xml from 'xml-js';
import { IInterpolationOptions, lex, TokenType } from './grammar';

/**
 * A type of object in i18next.
 */
export type I18nextNode = string | I18nextObject | Array<string | I18nextObject>;

/**
 * Object type for i18next JSON files. i18next support deeply nesting
 * object and array types.
 */
export interface I18nextObject {
  [key: string]: I18nextNode;
}

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
 * Options for appendToXmbObject.
 */
export interface IAppendToXmbObjectOptions extends IObjectToXmbObjectOptions {
  trim: boolean;
}

/**
 * Appends i18next messages to the XMB string.
 */
export function appendToXmbObject(
  xmb: xml.Element,
  object: I18nextObject,
  options: Partial<IAppendToXmbObjectOptions> = {},
): xml.Element {
  const mapped: { [id: string]: xml.Element } = {};
  for (const element of i18nextToXmbObject(object, options)) {
    mapped[element.attributes!.id!] = element;
  }

  if (!xmb.elements) {
    throw malformedError('elements are empty');
  }

  if (xmb.elements.length !== 2) {
    throw malformedError(
      `expected exactly two direct elements (doctype and messagebundle), ` +
        `got ${xmb.elements.length}`,
    );
  }

  const children = [...(xmb.elements[1].elements || [])];
  for (let i = 0; i < children.length; i++) {
    const existing = children[i];
    const id = String(existing.attributes && existing.attributes.id);

    if (mapped[id]) {
      children[i] = mapped[id];
      delete mapped[id];
    } else if (id.startsWith(options.prefix || '') && options.trim) {
      children.splice(i--, 1);
    }
  }

  Object.keys(mapped).forEach(id => children.push(mapped[id]));

  return {
    ...xmb,
    elements: [
      xmb.elements[0],
      {
        ...xmb.elements[1],
        elements: children,
      },
    ],
  };
}

/*
 * Options for appendToXmbString.
 */
export interface IAppendToXmbStringOptions extends IAppendToXmbObjectOptions {
  serialize: xml.Options.JS2XML;
  parse: xml.Options.XML2JS;
}

/**
 * Converts an i18next object to a fully-qualified XMB file.
 */
export function appendToXmbString(
  xmb: string,
  object: I18nextObject,
  options: Partial<IAppendToXmbStringOptions> = {},
) {
  const parsed = xml.xml2js(xmb, { ...options.parse, compact: false });

  return xml.js2xml(appendToXmbObject(parsed as xml.Element, object, options), {
    ...options.serialize,
  });
}

function malformedError(details: string): Error {
  return new Error(`The provided XMB file is invalid: ${details}`);
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

/**
 * Replaces trailing and leading, or multiple-sequential spaces in the text to
 * ensure that they get preserved in XML, with a unicode space. xml-js
 * in particular doesn't support this, but other tooling generally does
 * and we can manually swap it back when we convert the other way.
 */
function preserveSpaces(text: string) {
  return text.replace(/^ +|  +| +$/g, value => '\\u0020'.repeat(value.length));
}
