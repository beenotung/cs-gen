import { readFile, scanRecursively, writeFile } from '@beenotung/tslib/fs';
import { Call as _Call } from '../types';
import { genCallTypeCode2 } from './gen-code';

type Call = _Call<string, string, string, string>;

function extractInjectNames(text: string): string[] {
  const matches = text.match(/\/\/ inject (.*)? below/g);
  if (matches === null) {
    return [];
  }
  return matches.map(s =>
    s.substring('// inject '.length, s.indexOf(' below')),
  );
}

function injectInto(
  text: string,
  name: string,
  code: string,
): string | 'not_match' {
  let prefix = `// inject ${name} below`;
  let suffix = `// injected ${name} above`;
  const start = text.indexOf(prefix);
  if (start === -1) {
    return 'not_match';
  }
  const end = text.indexOf(suffix, start + prefix.length);
  if (end === -1) {
    return 'not_match';
  }
  const before = text.substring(0, start);
  let i = text.indexOf('\n', start);
  if (i === -1) {
    i = text.length;
  } else {
    i++;
  }
  prefix = text.substring(start, i);
  i = text.indexOf('\n', end);
  if (i === -1) {
    i = text.length;
  } else {
    i++;
  }
  suffix = text.substring(end, i);
  const after = text.substring(end + suffix.length);
  if (!code.endsWith('\n')) {
    code += '\n';
  }
  const newCode = before + prefix + code + suffix + after;
  return newCode;
}

export let injectCodes = new Map<string, string>();

export function scanProject(args: {
  outDirname: string;
  callTypes: Call[];
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
}) {
  const {
    outDirname,
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
  } = args;
  return scanRecursively({
    entryPath: outDirname,
    dereferenceSymbolicLinks: false,
    skipDir: (pathname, basename) => basename === 'node_modules',
    onFile: async (filename, basename) => {
      const bin = await readFile(filename);
      const originalCode = bin.toString();
      const names = extractInjectNames(originalCode);
      let code = originalCode;
      names.forEach(name => {
        switch (name) {
          case 'command type':
            code = injectInto(
              code,
              name,
              genCallTypeCode2({ ...args, callTypeName: commandTypeName }),
            );
            break;
          case 'query type':
            code = injectInto(
              code,
              name,
              genCallTypeCode2({ ...args, callTypeName: queryTypeName }),
            );
            break;
          case 'subscribe type':
            code = injectInto(
              code,
              name,
              genCallTypeCode2({ ...args, callTypeName: subscribeTypeName }),
            );
            break;
          default:
            console.error('unknown inject point:', name);
        }
      });
      if (code !== originalCode) {
        await writeFile(filename, code);
      }
    },
  });
}
