import { expect } from 'chai';
import { appendToXmbString, i18nextToXmbString } from './serialize';

describe('serialization', () => {
  it('creates xml from an input object', () => {
    expect(
      i18nextToXmbString(
        {
          key: 'value',
          keyDeep: {
            inner: 'value',
            nested: ['foo', { bar: 'value {{ replaced }}' }],
          },
          keyNesting: 'reuse $t(keyDeep.inner)',
          keyInterpolate: 'replace this {{value}}',
          keyInterpolateUnescaped: 'replace this {{- value}}',
          keyInterpolateWithFormatting: 'replace this {{value, format}}',
        },
        { serialize: { spaces: 2 }, prefix: 'foo:' },
      ),
    ).to.equal(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE <!ELEMENT messagebundle (msg)*>
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
<!ELEMENT ex (#PCDATA)>>
<messagebundle>
  <msg id="foo:keyInterpolateWithFormatting" desc="replace this {{value, format}}">replace this\\u0020
    <ph>
      <ex>{"type":2,"value":"value","format":"format"}</ex>
    </ph>
  </msg>
  <msg id="foo:keyInterpolateUnescaped" desc="replace this {{- value}}">replace this\\u0020
    <ph>
      <ex>{"type":1,"value":"value"}</ex>
    </ph>
  </msg>
  <msg id="foo:keyInterpolate" desc="replace this {{value}}">replace this\\u0020
    <ph>
      <ex>{"type":2,"value":"value"}</ex>
    </ph>
  </msg>
  <msg id="foo:keyNesting" desc="reuse $t(keyDeep.inner)">reuse\\u0020
    <ph>
      <ex>{"type":3,"args":["keyDeep.inner"]}</ex>
    </ph>
  </msg>
  <msg id="foo:keyDeep.nested.1.bar" desc="value {{ replaced }}">value\\u0020
    <ph>
      <ex>{"type":2,"value":"replaced"}</ex>
    </ph>
  </msg>
  <msg id="foo:keyDeep.nested.0" desc="foo">foo</msg>
  <msg id="foo:keyDeep.inner" desc="value">value</msg>
  <msg id="foo:key" desc="value">value</msg>
</messagebundle>`);
  });

  it('replaces xml', () => {
    const original = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE >
<messagebundle>
  <msg id="foo:first" desc="value">value1</msg>
  <msg id="foo:second" desc="value">value2</msg>
</messagebundle>`;
    const expected = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE >
<messagebundle>
  <msg id="foo:first" desc="updated!">updated!</msg>
  <msg id="foo:second" desc="value">value2</msg>
  <msg id="foo:third" desc="value3">value3</msg>
</messagebundle>`;

    expect(
      appendToXmbString(
        original,
        { first: 'updated!', third: 'value3' },
        { prefix: 'foo:', serialize: { spaces: 2 } },
      ),
    ).to.equal(expected);
  });

  it('trims missing elements when requested', () => {
    const original = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE >
<messagebundle>
  <msg id="foo:first" desc="value">value1</msg>
  <msg id="foo:second" desc="value">value2</msg>
  <msg id="other" desc="value">value3</msg>
</messagebundle>`;
    const expected = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE >
<messagebundle>
  <msg id="foo:second" desc="value">value</msg>
  <msg id="other" desc="value">value3</msg>
</messagebundle>`;

    expect(
      appendToXmbString(
        original,
        { second: 'value' },
        { prefix: 'foo:', serialize: { spaces: 2 }, trim: true },
      ),
    ).to.equal(expected);
  });
});
