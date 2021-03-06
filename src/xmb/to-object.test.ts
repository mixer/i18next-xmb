import { expect } from 'chai';
import { IInterpolationToken } from '../grammar';
import { testCases } from './object.test.fixture';
import { i18nextToXmbString, xmlDocType } from './to-object';

describe('to object', () => {
  Object.keys(testCases).forEach(name => {
    const { input, output } = testCases[name];
    it(name, () =>
      expect(i18nextToXmbString(input, { serialize: { spaces: 2 }, prefix: 'foo:' })).to.deep.equal(
        output,
      ),
    );
  });

  it('uses custom interpolation encoding', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ${xmlDocType}>
<messagebundle>
  <msg id="foo:keyInterpolateWithFormatting" desc="replace:{{ HELLO }}">replace:
    <ph name="INTERPOLATION_1">
      <ex>hello</ex>
    </ph>
  </msg>
</messagebundle>`;

    expect(
      i18nextToXmbString(
        {
          'foo:keyInterpolateWithFormatting': 'replace:{{ HELLO }}',
        },
        {
          encodeInterpolation: e => (e as IInterpolationToken).value.toLowerCase(),
          serialize: { spaces: 2 },
        },
      ),
    ).to.deep.equal(xml);
  });

  it('sets the description key', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ${xmlDocType}>
<messagebundle>
  <msg id="nested.thing" desc="Another greeting here">Hola!</msg>
  <msg id="foo" desc="Greeting here">Hello!</msg>
</messagebundle>`;

    expect(
      i18nextToXmbString(
        {
          foo: 'Hello!',
          _foo: 'Greeting here',
          nested: {
            thing: 'Hola!',
            _thing: 'Another greeting here',
          },
        },
        {
          descriptionKey: e => `_${e}`,
          serialize: { spaces: 2 },
        },
      ),
    ).to.deep.equal(xml);
  });
});
