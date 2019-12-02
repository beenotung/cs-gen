function extract(s: string): string[] {
  return s
    .split('\n')
    .map(s => s)
    .filter(s => s);
}

let types = extract(`
InvalidToken
InvalidAppId
QuotaExcess
NoPermission
UserNotFound
Duplicated
`);

let trues = extract(`
Admin
AdminOnly
OptionalAuth
`);
`${trues.map(name => `export const ${name} = true;`).join('\n')}
${types.map(type => `export const ${type}: '${type}' = '${type}';`).join('\n')}
`;
