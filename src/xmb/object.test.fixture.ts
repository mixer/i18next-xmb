import { I18nextObject } from '../types';

export const testCases: { [key: string]: { input: I18nextObject; output: string } } = {
  'Sample object': {
    input: {
      key: 'value',
      keyDeep: {
        inner: 'value',
        nested: ['foo', { bar: 'value {{ replaced }}' }],
      },
      keyNesting: 'reuse $t(keyDeep.inner)',
      keyInterpolate: 'replace this {{ value }}',
      keyInterpolateUnescaped: 'replace this {{- value }}',
      keyInterpolateWithFormatting: 'replace this {{ value, format }}',
    },
    output: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE messagebundle [
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
]>
<messagebundle>
  <msg id="foo:keyInterpolateWithFormatting" desc="replace this {{ value, format }}">replace this\\u0020
    <ph name="INTERPOLATION_1">
      <ex>{"type":2,"value":"value","format":"format"}</ex>
    </ph>
  </msg>
  <msg id="foo:keyInterpolateUnescaped" desc="replace this {{- value }}">replace this\\u0020
    <ph name="INTERPOLATION_1">
      <ex>{"type":1,"value":"value"}</ex>
    </ph>
  </msg>
  <msg id="foo:keyInterpolate" desc="replace this {{ value }}">replace this\\u0020
    <ph name="INTERPOLATION_1">
      <ex>{"type":2,"value":"value"}</ex>
    </ph>
  </msg>
  <msg id="foo:keyNesting" desc="reuse $t(keyDeep.inner)">reuse\\u0020
    <ph name="INTERPOLATION_1">
      <ex>{"type":3,"args":["keyDeep.inner"]}</ex>
    </ph>
  </msg>
  <msg id="foo:keyDeep.nested.1.bar" desc="value {{ replaced }}">value\\u0020
    <ph name="INTERPOLATION_1">
      <ex>{"type":2,"value":"replaced"}</ex>
    </ph>
  </msg>
  <msg id="foo:keyDeep.nested.0" desc="foo">foo</msg>
  <msg id="foo:keyDeep.inner" desc="value">value</msg>
  <msg id="foo:key" desc="value">value</msg>
</messagebundle>`,
  },
};
