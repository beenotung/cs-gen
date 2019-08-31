import { writeFileSync } from 'fs';

let Reasons: string[] = [
  'InvalidToken',
  'InvalidAppId',
  'QuotaExcess',
  'NoPermission',
  'UserNotFound',
];

let buffer: string[] = [];
for (let Reason of Reasons) {
  buffer.push(`export const ${Reason} = '${Reason}';`);
}
writeFileSync('gen-project-reasons.ts', buffer.join('\n'));
console.log('saved to gen-project-reasons.ts');
buffer = [];
for (let Reason of Reasons) {
  buffer.push(`export const ${Reason}: { Success: false, Reason: '${Reason}' } = { Success: false, Reason: '${Reason}' };`);
}
writeFileSync('server-reasons.ts', buffer.join('\n'));
console.log('saved to server-reasons.ts');
