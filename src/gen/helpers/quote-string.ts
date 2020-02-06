import { CallMeta } from '../../types';

export function quoteString(s: string): string {
  return '`' + s.replace(/\\/g, '\\\\') + '`';
}

function callFieldToQuoteString(o: any): string {
  if (typeof o !== 'string') {
    return JSON.stringify(o, null, 2);
  }
  return quoteString(o);
}

export function objectToQuoteString(call: object): string {
  return `{${Object.entries(call)
    .filter(([_key, value]) => value !== undefined)
    .map(
      ([key, value]) => `
    ${key}: ${callFieldToQuoteString(value)},`,
    )
    .join('')}
  }`;
}

export function callsToQuoteString(calls: CallMeta[]): string {
  return `[
  ${calls.map(call => objectToQuoteString(call)).join(`,
  `)}
]`;
}
