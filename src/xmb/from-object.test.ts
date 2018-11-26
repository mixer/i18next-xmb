import { expect } from 'chai';
import { fromXmbString } from './from-object';
import { testCases } from './object.test.fixture';

describe('from object', () => {
  Object.keys(testCases).forEach(name => {
    const { input, output } = testCases[name];
    it(name, () => expect(fromXmbString(output, { prefix: 'foo:' })).to.deep.equal(input));
  });
});
