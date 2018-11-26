import { expect } from 'chai';
import { appendToXmbString } from './append';

describe('append', () => {
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
