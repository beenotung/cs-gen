export function help() {
  console.log(
    `
cqrs-exp [command]
Commands:
  init  : initialize project skeleton, setup package.json and create scripts/gen-project.ts with default settings
  gen   : generate the client-side SDK for *-client and *-admin project, and stub code for *-server project
  help  : show this help message
`.trim(),
  );
}
