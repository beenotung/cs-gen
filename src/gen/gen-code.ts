import { Call } from '../types';

function removeTsExtname(s: string): string {
  return s.replace(/\.ts$/, '');
}

function getTypeFileImportPath(args: {
  typeDirname: string;
  typeFilename: string;
}) {
  const { typeDirname, typeFilename } = args;
  return `'../${typeDirname}/${removeTsExtname(typeFilename)}'`;
}

export function genServiceCode(args: {
  serviceClassName: string;
  typeDirname: string;
  typeFilename: string;
  typeNames: string[];
  callTypeName: string;
}) {
  const { callTypeName, serviceClassName } = args;
  const code = `
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ${[callTypeName, ...args.typeNames]
    .sort()
    .join(', ')} } from ${getTypeFileImportPath(args)};

function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED);
}

@Injectable()
export class ${serviceClassName} {
  Call<C extends Call>(Type: C['Type']): (In: C['In']) => C['Out'] {
    const _type = Type as Call['Type'];
    let res: (In: C['In']) => C['Out'];
    switch (_type) {
      ${args.typeNames
        .map(
          s => `case '${s}':
        res = this.${s};
        break;
      `,
        )
        .join('')
        .trim()}
      default:
        const x: never = _type;
        console.log('not implemented call type:', x);
        throw new HttpException('not implemented call type:' + x, HttpStatus.NOT_IMPLEMENTED);
    }
    return res.bind(this);
  }

  ${args.typeNames
    .map(
      s => `${s}(In: ${s}['In']): ${s}['Out'] {
    return not_impl('${s}');
  }

  `,
    )
    .join('')
    .trim()}
}
`;
  return code.trim();
}

export function genControllerCode(args: {
  typeDirname: string;
  typeFilename: string;
  callTypeName: string;
  serviceClassName: string;
  serviceFilename: string;
  controllerClassName: string;
  serviceApiPath: string;
  callApiPath: string;
}) {
  const {
    callTypeName,
    serviceClassName,
    serviceFilename,
    serviceApiPath,
    callApiPath,
    controllerClassName,
  } = args;
  const serviceObjectName =
    serviceClassName[0].toLowerCase() + serviceClassName.substring(1);
  return `
import { Body, Controller, Post } from '@nestjs/common';
import { ${callTypeName} } from ${getTypeFileImportPath(args)};
import { LogService } from 'cqrs-exp';
import { ${serviceClassName} } from './${removeTsExtname(serviceFilename)}';

@Controller('${serviceApiPath}')
export class ${controllerClassName} {
  constructor(
    public logService: LogService,
    public ${serviceObjectName}: ${serviceClassName},
  ) {
    this.restore();
  }

  restore() {
    const keys = this.logService.getKeysSync();
    for (const key of keys) {
      const call = this.logService.getObject<${callTypeName}>(key);
      this.coreService.Call(call.Type)(call.In);
    }
  }

  @Post('${callApiPath}')
  async call<C extends ${callTypeName}>(@Body()body: { Type: C['Type'], In: C['In'] }): Promise<{ Out: C['Out'] }> {
    this.logService.storeObject(body);
    const out = this.coreService.Call(body.Type)(body.In);
    return Promise.resolve(out).then(Out => ({ Out }));
  }
}
`.trim();
}

function genCallTypesCode(callTypes: Call[]) {
  return callTypes
    .map(
      ({ Type, In, Out }) => `export type ${Type} = {
  Type: '${Type}',
  In: ${In},
  Out: ${Out},
};
`,
    )
    .join('')
    .trim();
}

export function genTypeCode(args: {
  queryTypes: Call[];
  commandTypes: Call[];
  callTypeName: string;
  queryTypeName: string;
  commandTypeName: string;
}) {
  const {
    callTypeName,
    queryTypeName,
    commandTypeName,
    queryTypes,
    commandTypes,
  } = args;
  const code = `
import { checkCallType } from 'cqrs-exp';

${genCallTypesCode(queryTypes)}

export type ${queryTypeName} = ${queryTypes
    .map(({ Type }) => Type)
    .join(' | ') || 'never'};

${genCallTypesCode(commandTypes)}

export type ${commandTypeName} = ${commandTypes
    .map(({ Type }) => Type)
    .join(' | ') || 'never'};

export type ${callTypeName} = ${queryTypeName} | ${commandTypeName};

checkCallType({} as ${callTypeName});
`;
  return code.replace(/\n\n\n\n/g, '\n\n').trim();
}
