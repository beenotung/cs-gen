let types = `
InvalidToken
InvalidAppId
QuotaExcess
NoPermission
UserNotFound
Duplicated
`
  .split('\n')
  .map(s => s)
  .filter(s => s);
`export const Admin = true;
export const AdminOnly = true;
${types.map(type => `export const ${type}: '${type}' = '${type}';`).join('\n')}
`;
