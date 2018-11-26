import { expect } from 'chai';
import { testCases } from './object.test.fixture';
import { i18nextToXmbString } from './to-object';

describe('to object', () => {
  Object.keys(testCases).forEach(name => {
    const { input, output } = testCases[name];
    it(name, () =>
      expect(i18nextToXmbString(input, { serialize: { spaces: 2 }, prefix: 'foo:' })).to.deep.equal(
        output,
      ),
    );
  });
});
