import path from 'path';
import { getTypeFileImportPath } from '../../../gen-code';
import { getModuleDirname } from '../../../gen-file';
import { saveCode, wrapResult } from '../../helpers';

export async function genServerHelperFile(
  args: {
    serverHelperFilename: string;
  } & Parameters<typeof genServerHelperCode>[0] &
    Parameters<typeof getModuleDirname>[0],
) {
  const { serverHelperFilename } = args;
  const filename = path.join(getModuleDirname(args), serverHelperFilename);
  const code = genServerHelperCode(args);

  await saveCode(filename, code);
}

export function genServerHelperCode(args: {
  callTypeName: string;
  typeDirname: string;
  typeFilename: string;
  libDirname: string;
  asyncLogicProcessor: boolean;
  staticControllerReference: boolean;
  ws: boolean;
}) {
  const {
    callTypeName,
    libDirname,
    asyncLogicProcessor,
    staticControllerReference,
    ws,
  } = args;
  let code = ``;

  // import statements
  if (ws) {
    code += `
import { Primus } from 'typestub-primus';`;
  }
  if (staticControllerReference) {
    code += `
import { ${callTypeName}, CallInput } from ${getTypeFileImportPath(args)};`;
  }
  if (asyncLogicProcessor) {
    code += `
import { Result } from '../${libDirname}/result';`;
  }

  // body
  if (code) {
    code += '\n';
  }
  code += `
export const ok: { Success: true } = { Success: true };
`;
  if (ws) {
    // prettier-ignore
    code += `
export let resolvePrimus: (primus: Primus) => void
export let primusPromise = new Promise<Primus>(resolve => {
  resolvePrimus = resolve
})

export function usePrimus(f: (primus: Primus) => void): void {
  primusPromise.then(f)
}
`;
  }
  if (staticControllerReference || asyncLogicProcessor) {
    // prettier-ignore
    code += `
interface Instance {${asyncLogicProcessor ? `
  ready: Promise<void>` : ''}${staticControllerReference ? `
  storeAndCall<C extends ${callTypeName}>({
    call,
    from,
  }: {
    call: CallInput<C>
    from: 'server' | 'client'
  }): ${wrapResult(`C['Out']`, args)}` : ''}
}

export let instance: Instance = {} as any
`;
  }
  if (staticControllerReference) {
    // prettier-ignore
    code += `
export function storeAndCall<C extends ${callTypeName}>(
  call: CallInput<C>,
): ${wrapResult(`C['Out']`, args)} {
  return instance.storeAndCall({ call, from: 'server' });
}
`;
  }
  return code;
}
