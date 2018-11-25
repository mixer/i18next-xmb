/**
 * Options passed to the lexer and compiler.
 */
export interface IInterpolationOptions {
  prefix: string;
  suffix: string;
  nestingSuffix: string;
  nestingPrefix: string;
  unescapeSuffix: string;
  unescapePrefix: string;
  formatSeparator: string;
}

/**
 * Default interpolation options.
 */
const defaultOptions: IInterpolationOptions = {
  prefix: '{{',
  suffix: '}}',
  nestingPrefix: '$t(',
  nestingSuffix: ')',
  unescapePrefix: '-',
  unescapeSuffix: '',
  formatSeparator: ',',
};

/**
 * Enum of token types.
 */
export const enum TokenType {
  Text,
  UnescapedInterpolation,
  Interpolation,
  Nesting,
}

/**
 * Token for a simple text value.
 */
export interface ITextToken {
  type: TokenType.Text;
  value: string;
}

/**
 * Token for an optionally formatted escaped interpolation.
 */
export interface IInterpolationToken {
  type: TokenType.Interpolation;
  value: string;
  format?: string;
}

/**
 * Token for an explicitly unescaped token.
 */
export interface IUnescapedInterpolationToken {
  type: TokenType.UnescapedInterpolation;
  value: string;
  format?: string;
}

/**
 * Token for a nested message.
 */
export interface INestingToken {
  type: TokenType.Nesting;
  value: string;
}

/*
 * Type of possible tokens produced from the lexer.
 */
export type Token = ITextToken | IInterpolationToken | IUnescapedInterpolationToken | INestingToken;

/**
 * Replaces "tags" in text tokens which are wrapped with the given prefix and
 * suffix. Passes the contents of these tags to the "mapper" function, which
 * should return a replacement token.
 */
function mapReplacements(
  tokens: Token[],
  prefix: string,
  suffix: string,
  mapper: (value: string) => Token,
): Token[] {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== TokenType.Text) {
      continue;
    }

    const prefixIndex = token.value.indexOf(prefix);
    if (prefixIndex === -1) {
      continue;
    }

    const suffixIndex = token.value.indexOf(suffix, prefixIndex);
    if (suffixIndex === -1) {
      continue;
    }

    tokens.splice(
      i,
      1,
      { type: TokenType.Text, value: token.value.slice(0, prefixIndex) },
      mapper(token.value.slice(prefixIndex + prefix.length, suffixIndex)),
      { type: TokenType.Text, value: token.value.slice(suffixIndex + suffix.length) },
    );
  }

  return tokens;
}

/**
 * Simplifies the list of tokens, removing empty text tokens and merging
 * adjacent text tokens.
 */
function simplifyTokens(tokens: Token[]): Token[] {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== TokenType.Text) {
      continue;
    }

    if (!token.value) {
      tokens.splice(i--, 1);
      continue;
    }

    if (i > 0 && tokens[i - 1].type === TokenType.Text) {
      tokens.splice(--i, 1, { type: TokenType.Text, value: tokens[i - 1].value + token.value });
    }
  }

  return tokens;
}

function extractFormat(
  formatSeparator: string,
  token: IInterpolationToken | IUnescapedInterpolationToken,
) {
  const formatIndex = token.value.indexOf(formatSeparator);
  if (formatIndex !== -1) {
    token.format = token.value.slice(formatIndex + formatSeparator.length).trim();
    token.value = token.value.slice(0, formatIndex).trim();
  }

  return token;
}

/**
 * Lexes the interpolation input into its component tokens.
 */
export function lex(input: string, partialOptions?: Partial<IInterpolationOptions>): Token[] {
  const options = { ...defaultOptions, ...partialOptions };
  let tokens: Token[] = [{ type: TokenType.Text, value: input }];

  tokens = mapReplacements(tokens, options.prefix, options.suffix, untrimmed => {
    const value = untrimmed.trim();

    if (value.startsWith(options.unescapePrefix) && value.endsWith(options.unescapeSuffix)) {
      return extractFormat(options.formatSeparator, {
        type: TokenType.UnescapedInterpolation,
        value: value
          .slice(
            options.unescapePrefix.length,
            options.unescapeSuffix ? -options.unescapeSuffix.length : undefined,
          )
          .trim(),
      });
    }

    return extractFormat(options.formatSeparator, { type: TokenType.Interpolation, value });
  });

  tokens = mapReplacements(tokens, options.nestingPrefix, options.nestingSuffix, value => ({
    type: TokenType.Nesting,
    value,
  }));

  return simplifyTokens(tokens);
}

/**
 * Converts a list of tokens back into a string.
 */
export function compile(
  tokens: ReadonlyArray<Token>,
  partialOptions?: Partial<IInterpolationOptions & { spaceAround?: boolean }>,
): string {
  const options = { ...defaultOptions, spaceAround: true, ...partialOptions };
  const extraSpace = options.spaceAround ? ' ' : '';
  const formatValue = (format: string | void) =>
    format ? options.formatSeparator + extraSpace + format : '';

  let output = '';
  for (const token of tokens) {
    switch (token.type) {
      case TokenType.Text:
        output += token.value;
        break;
      case TokenType.Interpolation:
        output +=
          options.prefix +
          extraSpace +
          token.value +
          formatValue(token.format) +
          extraSpace +
          options.suffix;
        break;
      case TokenType.UnescapedInterpolation:
        output +=
          options.prefix +
          options.unescapePrefix +
          extraSpace +
          token.value +
          formatValue(token.format) +
          extraSpace +
          options.unescapeSuffix +
          options.suffix;
        break;
      case TokenType.Nesting:
        output += options.nestingPrefix + token.value + options.nestingSuffix;
        break;
      default:
        throw new Error(`Unknown TokenType in token ${JSON.stringify(token)}.`);
    }
  }

  return output;
}
