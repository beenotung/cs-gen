import * as path from 'path';
import { saveExe } from '../helpers';

export async function genFormatScriptFile(
  args: {
    injectFormat: boolean;
    outDirname: string;
  } & Parameters<typeof genFormatScriptCode>[0],
) {
  if (!args.injectFormat) {
    return;
  }
  const filename = path.join(args.outDirname, 'scripts', 'format');
  const code = genFormatScriptCode(args);
  await saveExe(filename, code);
}

export function genFormatScriptCode(args: {
  serverProjectName: string;
  clientProjectName: string;
  adminProjectName: string;
}) {
  const { serverProjectName, clientProjectName, adminProjectName } = args;
  // prettier-ignore
  return `
#!/bin/bash
set -e
set -o pipefail
function run {
  cd "$1"
  if [ ! -d node_modules ]; then
    hash pnpm 2>/dev/null \\
      && pnpm i --prefer-offline \\
      || npm i
  fi
  npm run format &
  cd ..
}
run "${serverProjectName}"
run "${clientProjectName}"
run "${adminProjectName}"
for job in \`jobs -p\`; do
  wait $job
done
echo "done format."
`.trim();
}
