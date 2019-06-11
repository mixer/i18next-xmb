import { expect } from 'chai';
import { fromXmbString } from './from-object';
import { testCases } from './object.test.fixture';

describe('from object', () => {
  Object.keys(testCases).forEach(name => {
    const { input, output } = testCases[name];
    it(name, () => expect(fromXmbString(output, { prefix: 'foo:' })).to.deep.equal(input));
  });

  it('uses custom interpolation decoding', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE messagebundle [
      <!ELEMENT messagebundle (msg)*>
    ]>
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
});
