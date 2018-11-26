# i18next-xmb

This package contains and exports xmb compatibility tools for [`i18next`](https://www.i18next.com/). It also contains a grammar (string->ast and ast->string) for i18next interpolations.

## XMB Functionality

### `i18nextToXmbString(object, [options])`

Converts an i18next [JSON format](https://www.i18next.com/misc/json-format) `object` into an xmb string. `options` may contain the following properties:

 - **prefix** is a string which optionally prefixes all generated xmb message IDs with the given strings. This can be useful if you want to namespace your i18next data to extract it later.
 - **serialize** is an object that passes [options](https://github.com/nashwaan/xml-js#options-for-converting-js-object--json--xml) used to serialize the xmb to a string.
 - **interpolation** see Interpolation Options down below.

### `i18nextToXmbObject(object, [options])`

Converts an i18next [JSON format](https://www.i18next.com/misc/json-format) `object` into a list of XML objects for xml-js. `options` may contain the following properties:

 - **prefix** is a string which optionally prefixes all generated xmb message IDs with the given strings. This can be useful if you want to namespace your i18next data to extract it later.
 - **interpolation** see Interpolation Options down below.

### `appendToXmbString(xmb, object, [options])`

Parses an XMB string, appends an i18next [JSON format](https://www.i18next.com/misc/json-format) object to it, and returns the updated XML. `options` may contain the following properties:

 - **parse** is an object that passes options used to parse the xmb, if it's passed in as a string. See the [xml-js docs](https://github.com/nashwaan/xml-js#options-for-converting-xml--js-object--json) for more details.
 - **serialize** is an object that passes [options](https://github.com/nashwaan/xml-js#options-for-converting-js-object--json--xml) used to serialize the xmb back into a string.
 - **prefix** is a string which optionally prefixes all generated xmb message IDs with the given strings. This can be useful if you want to namespace your i18next data to extract it later.
 - **trim** is a boolean, defaulting to false, that indicates that unknown translations should be removed from the XMB. If **prefix** is also passed, then only messsage IDs with that prefix will be considered for removal.
 - **interpolation** see Interpolation Options down below.

### `appendToXmbObject(xmb, object, [options])`

Append data from an i18next [JSON format](https://www.i18next.com/misc/json-format) object into the xmb, which should have been parsed by [xml-js](https://github.com/nashwaan/xml-js#options-for-converting-js-object--json--xml) object. A new `xmb` object will be returned (the original object is not mutated). `options` may contain the following properties:

 - **prefix** is a string which optionally prefixes all generated xmb message IDs with the given strings. This can be useful if you want to namespace your i18next data to extract it later.
 - **trim** is a boolean, defaulting to false, that indicates that unknown translations should be removed from the XMB. If **prefix** is also passed, then only messsage IDs with that prefix will be considered for removal.
 - **interpolation** see Interpolation Options down below.

### `fromXmbString(xmb, [options])`

Parses an XMB string and returns all translations from it as an i18next [JSON format](https://www.i18next.com/misc/json-format) object. `options` may contain the following properties:

 - **parse** is an object that passes options used to parse the xmb, if it's passed in as a string. See the [xml-js docs](https://github.com/nashwaan/xml-js#options-for-converting-xml--js-object--json) for more details.
 - **prefix** is a string which optionally will only extract messages with the given prefix in their IDs. For use with the `append*` functions.
 - **interpolation** see Interpolation Options down below.

### `fromXmbObject(xmb, [options])`

Returns all translations from an xml-js xmb object as an i18next [JSON format](https://www.i18next.com/misc/json-format) object. `options` may contain the following properties:

 - **prefix** is a string which optionally will only extract messages with the given prefix in their IDs. For use with the `append*` functions.
 - **interpolation** see Interpolation Options down below.

### Interpolation Options

i18next allows interpolation settings to be configured in various ways. Most consumers are safe to leave this as `undefined`. This tool supports a relevant subset of them, passed to all functions in the `interpolation` property. This property may contain an object with the following:

 - **prefix** prefix for interpolation, defaults to `{{`.
 - **suffix** suffix for interpolation, defaults to `}}`.
 - **nestingPrefix** prefix for nesting mode, defaults to `$t(`.
 - **nestingSuffix** suffix to nesting mode, defaults to `)`.
 - **unescapePrefix** prefix for unescaped mode, defaults to `-`.
 - **unescapeSuffix** suffix to unescaped mode, defaults to undefined.
 - **formatSeparator** used to separate formatting from interpolation value, defaults to `,`.

## i18next Grammar

This package exports a grammar for i18next, which may be useful in writing tooling. We recommend using TypeScript if you're munging around with the grammar too much -- the grammar this package exports is type-safe and using TypeScript will save you some errors in your implementation.

### lex(string, [options])

Lexes a string into a list of tokens. The options are the Interpolation Options given above.

### compile(tokens, [options])

Compiles a list of tokens into an interpolation string. The options are the Interpolation Options given above, with an additional option `spaceAround`, defaulting to `true`, to control whether it should add extra space around the inteprolated tokens (e.g. `{{ hello }}` instead of `{{helllo}}`).
