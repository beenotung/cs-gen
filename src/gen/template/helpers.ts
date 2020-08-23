import { writeFile } from '@beenotung/tslib/fs';

export function wrapResult(
  type: string,
  args: {
    asyncLogicProcessor: boolean;
  },
) {
  return args.asyncLogicProcessor ? `Result<${type}>` : type;
}

export function formatCode(code: string) {
  return code.trim().replace(/\n\n\n/g, '\n\n');
}

export async function saveCode(filename: string, code: string) {
  code = formatCode(code);
  await writeFile(filename, code);
}
