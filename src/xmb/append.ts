import * as xml from 'xml-js';

import { I18nextObject } from '../types';
import { i18nextToXmbObject, IObjectToXmbObjectOptions } from './to-object';

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
 * Appends an i18next object to a fully-qualified XMB file.
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
