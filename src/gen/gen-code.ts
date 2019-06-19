import { groupBy } from '@beenotung/tslib/functional';
import { genTsType } from 'gen-ts-type';
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
import * as path from 'path';
import { Body, Controller, Post } from '@nestjs/common';
import { ${callTypeName} } from ${getTypeFileImportPath(args)};
import { LogService } from 'cqrs-exp';
import { ${serviceClassName} } from './${removeTsExtname(serviceFilename)}';
import { Bar } from 'cli-progress';

@Controller('${serviceApiPath}')
export class ${controllerClassName} {
  logService: LogService;
  ready: Promise<void>;

  constructor(
    public ${serviceObjectName}: ${serviceClassName},
  ) {
    this.logService = new LogService(path.join('data', 'log'));
    this.ready = this.restore();
  }

  async restore() {
    const keys = await this.logService.getKeys();
    const bar = new Bar({
      format: 'restore progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    bar.start(keys.length, 0);
    for (const key of keys) {
      const call = await this.logService.getObject<${callTypeName}>(key);
      this.coreService.Call(call.Type)(call.In);
      bar.increment(1);
    }
    bar.stop();
  }

  /*
  @Post('${callApiPath}')
  async call<C extends ${callTypeName}>(@Body()body: { Type: C['Type'], In: C['In'] }): Promise<{ Out: C['Out'] }> {
    await this.ready;
    this.logService.storeObject(body);
    const out = this.coreService.Call(body.Type)(body.In);
    return Promise.resolve(out).then(Out => ({ Out }));
  }
  */
}
`.trim();
}

function genCallTypesCode(callTypes: Call[]): string {
  return callTypes
    .map(callType => {
      const { CallType, Type, In } = callType;
      let out = '';
      if (callType.CallType !== 'Subscribe') {
        out = `
    Out: ${callType.Out},`;
      }
      return `export type ${Type} = {
    CallType: '${CallType}';
    Type: '${Type}',
    In: ${In},${out}
};
  `;
    })
    .join('')
    .trim();
}

export function genCallTypeCode(args: {
  callTypes: Call[];
  callTypeName: string;
  queryTypeName: string;
  commandTypeName: string;
  subscribeTypeName: string;
}) {
  const {
    queryTypeName,
    commandTypeName,
    subscribeTypeName,
    callTypeName,
    callTypes,
  } = args;
  const callTypesMap = groupBy(t => t.CallType, callTypes);
  const queryTypes = callTypesMap.get('Query') || [];
  const commandTypes = callTypesMap.get('Command') || [];
  const subscribeTypes = callTypesMap.get('Subscribe') || [];
  const code = `
import { checkCallType } from 'cqrs-exp';

${genCallTypesCode(commandTypes)}

export type ${commandTypeName} = ${commandTypes
    .map(({ Type }) => Type)
    .join(' | ') || 'never'};

${genCallTypesCode(queryTypes)}

export type ${queryTypeName} = ${queryTypes
    .map(({ Type }) => Type)
    .join(' | ') || 'never'};

${genCallTypesCode(subscribeTypes)}

export type ${subscribeTypeName} = ${subscribeTypes
    .map(({ Type }) => Type)
    .join(' | ') || 'never'};

export type ${callTypeName} = ${commandTypeName} | ${queryTypeName} | ${subscribeTypeName};

checkCallType({} as ${callTypeName});
`;
  return code.replace(/\n\n\n\n/g, '\n\n').trim();
}

export function genTypeCode(name: string, demo: any): string {
  return `
/** Example of ${name}:
${JSON.stringify(demo, null, 2)}
 */
export type ${name} = ${genTsType(demo)};
`.trim();
}

function insert(
  content: string,
  insertPattern: string,
  insertContent: string,
): string {
  const i = content.indexOf(insertPattern);
  if (i === -1) {
    throw new Error('failed to locate ' + JSON.stringify(insertPattern));
  }
  return content.substring(0, i) + insertContent + content.substring(i);
}

export function genMainCode(originalCode: string): string {
  if (originalCode.includes('attachServer')) {
    return originalCode;
  }
  let newCode = insert(
    originalCode,
    'async function bootstrap',
    `import { Server } from 'http';

const Primus = require('primus');
export let primus;

function attachServer(server: Server) {
  const primus_options = {
    pathname: '/primus',
    parser: 'JSON',
    compression: true,
    transformer: 'engine.io',
  };

  primus = new Primus(server, primus_options);

  // /*
  primus.on('connection', spark => {
    console.log(spark.id, 'connected');
    spark.write('hi from server');
    spark.on('data', data => {
      console.log('client data:', data);
    });
  });
  // */
}

`,
  );
  newCode = insert(
    newCode,
    'await app.listen',
    `attachServer(app.getHttpServer());
  `,
  );
  return newCode;
}
