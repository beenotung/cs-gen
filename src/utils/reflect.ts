import { genTsType } from 'gen-ts-type';

export function genTypeCode(demo: any): string {
  return `
/* Example: ${JSON.stringify(demo, null, 2)}
 */
${genTsType(demo)}
`;
}
