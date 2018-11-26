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
