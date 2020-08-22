import { writeFile } from '@beenotung/tslib/fs';
import path from 'path';
import { getTypeFileImportPath, removeTsExtname } from '../../../gen-code';
import { getModuleDirname } from '../../../gen-file';
import { wrapResult } from '../../helpers';

export async function genServerHelperFile(
  args: {
    serverHelperFilename: string;
  } & Parameters<typeof genServerHelperCode>[0] &
    Parameters<typeof getModuleDirname>[0],
) {
  const { serverHelperFilename } = args;
  const filename = path.join(getModuleDirname(args), serverHelperFilename);
  const code = genServerHelperCode(args);

  await writeFile(filename, code);
}

export function genServerHelperCode(args: {
  callTypeName: string;
  typeDirname: string;
  typeFilename: string;
  controllerFilename: string;
  controllerClassName: string;
  libDirname: string;
  asyncLogicProcessor: boolean;
  staticControllerReference: boolean;
}) {
  const {
    callTypeName,
    controllerFilename,
    controllerClassName,
    libDirname,
    asyncLogicProcessor,
    staticControllerReference,
  } = args;
  // prettier-ignore
  return `
import { ${callTypeName}, CallInput } from ${getTypeFileImportPath(args)};${asyncLogicProcessor ? `
import { Result } from '../${libDirname}/result';` : ``}
import { ${controllerClassName} } from './${removeTsExtname(controllerFilename)}';
${staticControllerReference ? `
export function storeAndCall<C extends ${callTypeName}>(
  call: CallInput<C>,
): ${wrapResult(`<C['Out']>`, args)} {
  return ${controllerClassName}.instance.storeAndCall({ call, from: 'server' });
}
` : ``}
export const ok: { Success: true } = { Success: true };
`.trim();
}
