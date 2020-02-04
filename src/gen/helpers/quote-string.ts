import { CallMeta } from '../../types';

function callFieldToQuoteString(o: any): string {
  if (typeof o !== 'string') {
    return JSON.stringify(o, null, 2);
  }
  return '`' + o.replace(/\\/g, '\\\\') + '`';
}

function callToQuoteString(call: CallMeta): string {
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
  ${calls.map(call => callToQuoteString(call)).join(`,
  `)}
]`;
}
