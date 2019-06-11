import { expect } from 'chai';
import { fromXmbString } from './from-object';
import { testCases } from './object.test.fixture';
import { xmlDocType } from './to-object';

describe('from object', () => {
  Object.keys(testCases).forEach(name => {
    const { input, output } = testCases[name];
    it(name, () => expect(fromXmbString(output, { prefix: 'foo:' })).to.deep.equal(input));
  });

  it('uses custom interpolation decoding', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ${xmlDocType}>
<messagebundle>
  <msg id="foo:keyInterpolateWithFormatting" desc="replace this {{ value, format }}">replace:
    <ph name="INTERPOLATION_1">
      <ex>hello</ex>
    </ph>
  </msg>
</messagebundle>`;

    expect(fromXmbString(xml, { decodeInterpolation: e => String(e).toUpperCase() })).to.deep.equal(
      {
        'foo:keyInterpolateWithFormatting': 'replace:{{ HELLO }}',
      },
    );
  });

  it('sets the description key', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ${xmlDocType}>
<messagebundle>
  <msg id="foo" desc="Greeting here">Hello!</msg>
  <msg id="nested.thing" desc="Another greeting here">Hola!</msg>
</messagebundle>`;

    expect(
      fromXmbString(xml, {
        decodeInterpolation: e => String(e).toUpperCase(),
        descriptionKey: e => `_${e}`,
      }),
    ).to.deep.equal({
      foo: 'Hello!',
      _foo: 'Greeting here',
      nested: {
        thing: 'Hola!',
        _thing: 'Another greeting here',
      },
    });
  });
});
