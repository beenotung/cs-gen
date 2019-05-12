import { groupBy } from '@beenotung/tslib';
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

export function genModuleCode(args: {
  moduleClassName: string;
  serviceFilename: string;
  serviceClassName: string;
  controllerFilename: string;
  controllerClassName: string;
}) {
  const {
    moduleClassName,
    serviceFilename,
    serviceClassName,
    controllerFilename,
    controllerClassName,
  } = args;
  return `
import { Module } from '@nestjs/common';
import { ${serviceClassName} } from './${removeTsExtname(serviceFilename)}';
import { LogService } from 'cqrs-exp';
import * as path from 'path';
import { ${controllerClassName} } from './${removeTsExtname(
    controllerFilename,
  )}';

@Module({
  controllers: [${controllerClassName}],
  providers: [${serviceClassName}, { provide: LogService, useValue: new LogService(path.join('data', 'log')) }],
})
export class ${moduleClassName} {
}
`.trim();
}

export function genServiceCode(args: {
  serviceClassName: string;
  typeDirname: string;
  typeFilename: string;
  typeNames: string[];
  callTypeName: string;
  logicProcessorDirname: string;
  logicProcessorFilename: string;
  logicProcessorClassName: string;
  logicProcessorCode: string;
}) {
  const {
    callTypeName,
    serviceClassName,
    logicProcessorDirname,
    logicProcessorFilename,
    logicProcessorClassName,
    logicProcessorCode,
    typeNames,
  } = args;
  const code = `
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ${[callTypeName, ...typeNames]
    .sort()
    .join(', ')} } from ${getTypeFileImportPath(args)};
import { ${logicProcessorClassName} } from '../${logicProcessorDirname}/${removeTsExtname(
    logicProcessorFilename,
  )}';

function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED);
}

@Injectable()
export class ${serviceClassName} {
  impl = new ${logicProcessorClassName}();

  Call<C extends Call>(Type: C['Type']): (In: C['In']) => C['Out'] {
    const _type = Type as Call['Type'];
    let res: (In: C['In']) => C['Out'];
    switch (_type) {
      ${typeNames
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

  ${typeNames
    .map(
      s => `${s}(In: ${s}['In']): ${s}['Out'] {
    ${
        logicProcessorCode.indexOf(s) === -1
          ? `return not_impl('${s}');`
          : `return this.impl.${s}(In);`
        }
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
import * as path from 'path';
import { Bar } from 'cli-progress';

@Controller('${serviceApiPath}')
export class ${controllerClassName} {
  logService: LogService;

  constructor(
    public ${serviceObjectName}: ${serviceClassName},
  ) {
    this.logService = new LogService(path.join('data', 'log'));
    this.restore();
  }

  restore() {
    const keys = this.logService.getKeysSync();
    const bar = new Bar({
      format: 'restore progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    bar.start(keys.length, 0);
    for (const key of keys) {
      const call = this.logService.getObject<${callTypeName}>(key);
      this.coreService.Call(call.Type)(call.In);
      bar.increment(1);
    }
    bar.stop();
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
  callTypes: Call[];
  callTypeName: string;
  queryTypeName: string;
  commandTypeName: string;
  mixedTypeName: string;
}) {
  const {
    queryTypeName,
    commandTypeName,
    mixedTypeName,
    callTypeName,
    callTypes,
  } = args;
  const callTypesMap = groupBy(t => t.CallType, callTypes);
  const queryTypes = callTypesMap.get('Query');
  const commandTypes = callTypesMap.get('Command');
  const mixedTypes = callTypesMap.get('Mixed');
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
${genCallTypesCode(commandTypes)}

export type ${mixedTypeName} = ${mixedTypes
    .map(({ Type }) => Type)
    .join(' | ') || 'never'};

export type ${callTypeName} = ${queryTypeName} | ${commandTypeName} | ${mixedTypeName};

checkCallType({} as ${callTypeName});
`;
  return code.replace(/\n\n\n\n/g, '\n\n').trim();
}
