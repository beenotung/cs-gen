function extract(s: string): string[] {
  return s
    .split('\n')
    .map(s => s)
    .filter(s => s);
}

let types = extract(`
InvalidToken
InvalidAppId
InvalidUserId
NetworkError
QuotaExcess
NoPermission
UserNotFound
Duplicated
`);

let trues = extract(`
Admin
Internal
OptionalAuth
RequiredAuth
Replay
`);
`${trues.map(name => `export const ${name} = true;`).join('\n')}
/** @deprecated use Admin or Internal flag instead */
export const AdminOnly = true;
${types.map(type => `export const ${type}: '${type}' = '${type}';`).join('\n')}
`;
