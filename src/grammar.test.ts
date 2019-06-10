import { expect } from 'chai';
import { compile, IInterpolationOptions, lex, Token } from './grammar';

const testCases: {
  [key: string]: { input: string; output: Token[]; options?: Partial<IInterpolationOptions> };
} = require('./grammar.test.cases.json');

describe('lex()', () => {
  Object.keys(testCases).forEach(tcase => {
    const { input, output, options } = testCases[tcase];
    it(tcase, () => {
      const results = lex(input, options).map(({ start, end, ...attrs }) => ({
        ...attrs,
        segment: input.slice(start, end),
      }));

      expect(results).to.deep.equal(output);
    });
  });
});

describe('compile()', () => {
  Object.keys(testCases).forEach(tcase => {
    const { input, output, options } = testCases[tcase];
    it(tcase, () => expect(compile(output, options)).to.deep.equal(input));
  });
});
